import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Harness regresi otorisasi klinis (audit v2.0 — menutup P0 #4 dari
 * docs/REMAINING-WORK.md).
 *
 * Skenario yang dijaga agar tidak kambuh:
 *  1. Terapis TANPA assignment aktif tidak boleh menulis/mengubah/memfinalisasi
 *     rekam medis pasien lain (regresi QA-SEC-01 v1.0).
 *  2. Terapis tanpa assignment tidak boleh membaca detail intake/PDF intake
 *     pasien lain (regresi QA-SEC-02 v1.0).
 *  3. Pasien (USER) tidak boleh membaca data milik pasien lain (IDOR).
 *  4. SUPER_ADMIN tidak punya izin klinis implisit (SA-005).
 *
 * Pola mock mengikuti tests/authorization/intake-review-notification.test.ts:
 * drizzle di-mock per tabel via Symbol.for('drizzle:Name').
 */

const mocks = vi.hoisted(() => {
  type Row = Record<string, unknown>;

  const state = {
    /** Data per nama tabel drizzle. Kueri apapun pada tabel ini mengembalikan baris ini. */
    rows: {} as Record<string, Row[]>,
    currentRole: 'THERAPIST' as string,
    currentUserId: 'therapist-unassigned',
    insertCalls: [] as { tableName: string; values: Row }[],
    updateCalls: [] as { tableName: string; set: Row }[],
  };

  const tableName = (table: unknown) =>
    (table as Record<symbol, unknown>)[Symbol.for('drizzle:Name')] as string;

  /** Rantai query yang mengembalikan baris pada limit/offset/returning/di-await. */
  function boundChain(name: string): unknown {
    const getRows = () => state.rows[name] ?? [];
    const make = (): Record<string, unknown> => {
      const obj: Record<string, unknown> = {};
      const terminal = new Set(['limit', 'offset', 'returning']);
      for (const method of [
        'from',
        'where',
        'orderBy',
        'groupBy',
        'innerJoin',
        'leftJoin',
        'limit',
        'offset',
        'returning',
      ]) {
        obj[method] = () => (terminal.has(method) ? Promise.resolve(getRows()) : make());
      }
      obj.then = (resolve: (v: Row[]) => unknown, reject: (e: unknown) => unknown) =>
        Promise.resolve(getRows()).then(resolve, reject);
      return obj;
    };
    return make();
  }

  const db = {
    select: () => ({
      from: (table: unknown) => boundChain(tableName(table)),
    }),
    insert: (table: unknown) => ({
      values: (values: Row) => {
        state.insertCalls.push({ tableName: tableName(table), values });
        return boundChain(tableName(table));
      },
    }),
    update: (table: unknown) => ({
      set: (set: Row) => ({
        where: () => {
          state.updateCalls.push({ tableName: tableName(table), set });
          return Promise.resolve();
        },
      }),
    }),
    delete: (table: unknown) => ({
      where: () => {
        state.updateCalls.push({ tableName: `delete:${tableName(table)}`, set: {} });
        return Promise.resolve();
      },
    }),
    batch: (operations: unknown[]) => Promise.all(operations).then(() => undefined),
  };

  return { state, db, tableName };
});

vi.mock('@/db', () => ({ getDb: () => mocks.db }));

vi.mock('@/lib/auth/require-session', () => ({
  requireSession: vi.fn(async () => ({
    session: { user: { id: mocks.state.currentUserId, email: 'dummy@dummy.hafta.test' } },
    role: mocks.state.currentRole,
  })),
}));

vi.mock('@/lib/audit', () => ({
  createAuditLog: vi.fn(async () => undefined),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { getDocumentForDownload } from '@/server/queries/documents';
import { getTherapyProgressById } from '@/server/queries/therapy-progress';
import {
  attachDocumentToRecord,
  fetchRecordAttachmentMeta,
} from '@/server/actions/record-attachments';
import { listRecordAttachmentMeta } from '@/server/queries/record-attachments';
import { getIntakeDetailForPdf } from '@/server/queries/patient-intakes';
import { getIntakeForPdf } from '@/server/actions/intake-pdf';
import {
  saveTherapyProgress,
  finalizeTherapyProgress,
  updateTherapyProgress,
} from '@/server/actions/therapy-progress';
import { requirePatientAccess } from '@/lib/permissions/resource-access';
import {
  authorize,
  canAccessPatient,
  ForbiddenError,
  hasPermission,
  PERMISSIONS,
} from '@/lib/permissions';

const PATIENT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const RECORD_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const INTAKE_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const DOCUMENT_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

const progressInput = {
  patientId: PATIENT_ID,
  painScore: 3,
  rangeOfMotionScore: 4,
  strengthScore: 4,
  functionScore: 5,
  summary: 'Catatan uji harness.',
};

function seedBaseRows() {
  mocks.state.rows = {
    patients: [{ id: PATIENT_ID, userId: 'patient-user', archivedAt: null, fullName: 'Pasien Dummy' }],
    patient_assignments: [],
    therapy_progress_records: [
      {
        id: RECORD_ID,
        patientId: PATIENT_ID,
        therapistId: mocks.state.currentUserId,
        status: 'DRAFT',
        amendedFromId: null,
        supersededAt: null,
        patientVisible: 0,
      },
    ],
    patient_intakes: [
      {
        id: INTAKE_ID,
        patientId: PATIENT_ID,
        patientUserId: 'patient-user',
        version: 1,
        status: 'SUBMITTED',
        chiefComplaint: 'Nyeri bahu',
      },
    ],
    patient_documents: [
      {
        id: DOCUMENT_ID,
        patientId: PATIENT_ID,
        storageKey: `patients/${PATIENT_ID}/file.pdf`,
        originalFilename: 'dokumen.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024,
        status: 'ACTIVE',
      },
    ],
    appointments: [],
    notifications: [],
    profiles: [],
  };
}

beforeEach(() => {
  mocks.state.insertCalls.length = 0;
  mocks.state.updateCalls.length = 0;
  mocks.state.currentRole = 'THERAPIST';
  mocks.state.currentUserId = 'therapist-unassigned';
  seedBaseRows();
});

// ── Skenario 1: terapis tanpa assignment tidak boleh menulis rekam medis ──
describe('S1 — terapis tanpa assignment aktif (regresi QA-SEC-01 v1.0)', () => {
  it('saveTherapyProgress menolak dan tidak menulis apa pun', async () => {
    const result = await saveTherapyProgress(progressInput);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('Akses ditolak');
    expect(mocks.state.insertCalls.filter((c) => c.tableName === 'therapy_progress_records')).toHaveLength(0);
  });

  it('updateTherapyProgress menolak rekam milik pasien yang tidak di-assign', async () => {
    const result = await updateTherapyProgress({ ...progressInput, recordId: RECORD_ID, status: 'DRAFT' });

    expect(result.ok).toBe(false);
    expect(mocks.state.updateCalls.filter((c) => c.tableName === 'therapy_progress_records')).toHaveLength(0);
  });

  it('finalizeTherapyProgress menolak walau rekam dibuat oleh terapis yang sama', async () => {
    // record.therapistId === currentUserId, tetapi assignment aktif kosong.
    const result = await finalizeTherapyProgress(RECORD_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('Akses ditolak');
    expect(mocks.state.updateCalls.filter((c) => c.tableName === 'therapy_progress_records')).toHaveLength(0);
  });

  it('KONTROL POSITIF: dengan assignment aktif, save berhasil (bukti harness bekerja)', async () => {
    mocks.state.rows.patient_assignments = [{ id: 'assignment-1' }];

    const result = await saveTherapyProgress(progressInput);

    expect(result.ok).toBe(true);
    expect(mocks.state.insertCalls.filter((c) => c.tableName === 'therapy_progress_records')).toHaveLength(1);
  });

  it('KONTROL POSITIF: update berhasil dengan assignment aktif', async () => {
    mocks.state.rows.patient_assignments = [{ id: 'assignment-1' }];

    const result = await updateTherapyProgress({ ...progressInput, recordId: RECORD_ID, status: 'DRAFT' });

    expect(result.ok).toBe(true);
    expect(mocks.state.updateCalls.filter((c) => c.tableName === 'therapy_progress_records')).toHaveLength(1);
  });
});

// ── Skenario 2: intake/PDF intake pasien lain (regresi QA-SEC-02 v1.0) ──
describe('S2 — scope intake terapis (regresi QA-SEC-02 v1.0)', () => {
  it('getIntakeDetailForPdf melempar ForbiddenError untuk terapis tanpa assignment', async () => {
    await expect(getIntakeDetailForPdf(INTAKE_ID, 'therapist-unassigned', 'THERAPIST')).rejects.toThrow(
      ForbiddenError,
    );
  });

  it('getIntakeForPdf (server action) ikut menolak untuk terapis tanpa assignment', async () => {
    await expect(getIntakeForPdf(INTAKE_ID)).rejects.toThrow(ForbiddenError);
    expect(
      mocks.state.insertCalls.filter((c) => c.tableName === 'audit_logs'),
    ).toHaveLength(0);
  });

  it('KONTROL POSITIF: terapis dengan assignment mendapatkan data intake', async () => {
    mocks.state.rows.patient_assignments = [{ id: 'assignment-1' }];

    const data = await getIntakeDetailForPdf(INTAKE_ID, 'therapist-unassigned', 'THERAPIST');

    expect(data).not.toBeNull();
    expect(data?.id).toBe(INTAKE_ID);
  });
});

// ── Skenario 3: IDOR lintas pasien ──
describe('S3 — pasien tidak dapat membuka data pasien lain (IDOR)', () => {
  it('requirePatientAccess menolak USER yang bukan pemilik pasien', async () => {
    mocks.state.currentRole = 'USER';
    mocks.state.currentUserId = 'attacker-user-id';
    // Kueri difilter by userId pemilik → tidak ada baris untuk penyerang.
    mocks.state.rows.patients = [];

    await expect(requirePatientAccess(PATIENT_ID, PERMISSIONS.PATIENT_READ)).rejects.toThrow(ForbiddenError);
  });

  it('getIntakeDetailForPdf menolak USER atas intake milik orang lain', async () => {
    await expect(getIntakeDetailForPdf(INTAKE_ID, 'attacker-user-id', 'USER')).rejects.toThrow(ForbiddenError);
  });

  it('requirePatientAccess menolak terapis tanpa assignment', async () => {
    mocks.state.currentRole = 'THERAPIST';

    await expect(requirePatientAccess(PATIENT_ID, PERMISSIONS.PATIENT_READ)).rejects.toThrow(ForbiddenError);
  });

  it('KONTROL POSITIF: requirePatientAccess mengembalikan pasien untuk pemiliknya', async () => {
    mocks.state.currentRole = 'USER';
    mocks.state.currentUserId = 'patient-user';
    mocks.state.rows.patients = [{ id: PATIENT_ID, userId: 'patient-user', fullName: 'Pasien Dummy' }];

    const patient = await requirePatientAccess(PATIENT_ID, PERMISSIONS.PATIENT_READ);

    expect(patient.id).toBe(PATIENT_ID);
  });

  it('USER tidak punya izin unduh dokumen sama sekali', async () => {
    mocks.state.currentRole = 'USER';

    await expect(getDocumentForDownload(DOCUMENT_ID)).rejects.toThrow(ForbiddenError);
  });

  it('terapis tanpa assignment tidak dapat mengunduh dokumen pasien lain', async () => {
    mocks.state.currentRole = 'THERAPIST';

    await expect(getDocumentForDownload(DOCUMENT_ID)).rejects.toThrow(ForbiddenError);
  });

  it('KONTROL POSITIF: ADMIN dapat mengunduh dokumen', async () => {
    mocks.state.currentRole = 'ADMIN';

    const doc = await getDocumentForDownload(DOCUMENT_ID);
    expect(doc.id).toBe(DOCUMENT_ID);
  });
});

// ── Skenario 4: SUPER_ADMIN tanpa izin klinis (SA-005) ──
describe('S4 — SUPER_ADMIN tidak memiliki izin klinis implisit', () => {
  const clinicalWritePermissions = [
    PERMISSIONS.PROGRESS_READ,
    PERMISSIONS.ASSESSMENT_CREATE,
    PERMISSIONS.ASSESSMENT_FINALIZE,
    PERMISSIONS.TREATMENT_PLAN_CREATE,
    PERMISSIONS.TREATMENT_PLAN_FINALIZE,
    PERMISSIONS.SESSION_CREATE,
    PERMISSIONS.SESSION_FINALIZE,
    PERMISSIONS.DOCUMENT_UPLOAD,
    PERMISSIONS.DOCUMENT_DOWNLOAD,
    PERMISSIONS.INTAKE_REVIEW,
    PERMISSIONS.INTAKE_ACCEPT,
  ];

  it('saveTherapyProgress ditolak untuk SUPER_ADMIN', async () => {
    mocks.state.currentRole = 'SUPER_ADMIN';
    mocks.state.currentUserId = 'super-admin-1';

    const result = await saveTherapyProgress(progressInput);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('tidak memiliki izin');
    expect(mocks.state.insertCalls.filter((c) => c.tableName === 'therapy_progress_records')).toHaveLength(0);
  });

  it('SUPER_ADMIN tidak memegang satupun izin klinis tulis/baca dokumen', () => {
    for (const permission of clinicalWritePermissions) {
      expect(hasPermission('SUPER_ADMIN', permission), permission).toBe(false);
    }
  });

  it('SUPER_ADMIN tetap memegang izin administratif', () => {
    expect(hasPermission('SUPER_ADMIN', PERMISSIONS.USER_LIST)).toBe(true);
    expect(hasPermission('SUPER_ADMIN', PERMISSIONS.AUDIT_READ)).toBe(true);
    expect(hasPermission('SUPER_ADMIN', PERMISSIONS.SETTINGS_MANAGE)).toBe(true);
    expect(hasPermission('SUPER_ADMIN', PERMISSIONS.PATIENT_LIST)).toBe(true);
  });

  it('canAccessPatient menuntut clinical scope eksplisit untuk SUPER_ADMIN', () => {
    const session = { user: { id: 'sa-1', email: 'sa@dummy.hafta.test', role: 'SUPER_ADMIN' as const } };

    expect(canAccessPatient(session, PATIENT_ID)).toBe(false);
    expect(canAccessPatient(session, PATIENT_ID, { hasExplicitClinicalScope: true })).toBe(true);
    // Scope "assigned" saja tidak cukup untuk SUPER_ADMIN.
    expect(canAccessPatient(session, PATIENT_ID, { assigned: true })).toBe(false);
  });
});

// ── Matriks izin peran (pengaman regresi kebijakan global) ──
describe('matriks izin lintas peran', () => {
  it('USER hanya punya izin milik sendiri dan tidak ada izin staf', () => {
    expect(hasPermission('USER', PERMISSIONS.PROGRESS_READ)).toBe(false);
    expect(hasPermission('USER', PERMISSIONS.PATIENT_LIST)).toBe(false);
    expect(hasPermission('USER', PERMISSIONS.USER_LIST)).toBe(false);
    expect(hasPermission('USER', PERMISSIONS.AUDIT_READ)).toBe(false);
    expect(hasPermission('USER', PERMISSIONS.DOCUMENT_LIST)).toBe(false);
    expect(hasPermission('USER', PERMISSIONS.PROGRESS_READ_OWN)).toBe(true);
  });

  it('STAFF tidak dapat menulis dokumentasi klinis', () => {
    for (const permission of [
      PERMISSIONS.ASSESSMENT_CREATE,
      PERMISSIONS.TREATMENT_PLAN_CREATE,
      PERMISSIONS.SESSION_CREATE,
      PERMISSIONS.PROGRESS_READ,
      PERMISSIONS.INTAKE_REVIEW,
    ]) {
      expect(hasPermission('STAFF', permission), permission).toBe(false);
    }
  });

  it('THERAPIST tidak memegang izin admin/audit', () => {
    for (const permission of [
      PERMISSIONS.AUDIT_READ,
      PERMISSIONS.ROLE_ASSIGN,
      PERMISSIONS.SETTINGS_MANAGE,
      PERMISSIONS.USER_SUSPEND,
      PERMISSIONS.PERMISSION_MANAGE,
    ]) {
      expect(hasPermission('THERAPIST', permission), permission).toBe(false);
    }
    // Tetap punya izin klinis (akan dibatasi assignment di lapisan resource).
    expect(hasPermission('THERAPIST', PERMISSIONS.ASSESSMENT_CREATE)).toBe(true);
  });

  it('authorize menolak USER atas resource milik orang lain', () => {
    const session = { user: { id: 'attacker', email: 'a@dummy.hafta.test', role: 'USER' as const } };

    expect(() =>
      authorize({ session, permission: PERMISSIONS.PATIENT_READ, resource: { userId: 'victim' } }),
    ).toThrow(ForbiddenError);

    expect(() =>
      authorize({ session, permission: PERMISSIONS.PATIENT_READ, resource: { userId: 'attacker' } }),
    ).not.toThrow();
  });

  it('authorize menolak USER membaca rekam klinis yang tidak visible', () => {
    const session = { user: { id: 'patient-1', email: 'p@dummy.hafta.test', role: 'USER' as const } };

    expect(() =>
      authorize({
        session,
        permission: PERMISSIONS.ASSESSMENT_READ,
        resource: { patientVisible: false },
      }),
    ).toThrow(ForbiddenError);
  });

  it('authorize menolak sesi tanpa user', () => {
    expect(() =>
      authorize({
        session: undefined as never,
        permission: PERMISSIONS.PATIENT_READ,
      }),
    ).toThrow('Silakan login terlebih dahulu');
  });
});


// ── Skenario 5: scope BACA rekam medis & lampiran ──────────────────────────
describe('S5 — scope baca rekam medis dan lampiran rekam', () => {
  it('getTherapyProgressById mengembalikan null untuk terapis tanpa assignment', async () => {
    const record = await getTherapyProgressById(RECORD_ID);
    expect(record).toBeNull();
  });

  it('KONTROL POSITIF: terapis dengan assignment aktif dapat membaca rekam', async () => {
    mocks.state.rows.patient_assignments = [{ id: 'assignment-1', patientId: PATIENT_ID }];
    const record = await getTherapyProgressById(RECORD_ID);
    expect(record).not.toBeNull();
    expect(record?.id).toBe(RECORD_ID);
  });

  it('USER tidak dapat membaca rekam milik pasien lain', async () => {
    mocks.state.currentRole = 'USER';
    mocks.state.currentUserId = 'intruder-user';
    mocks.state.rows.therapy_progress_records = [
      {
        id: RECORD_ID,
        patientId: PATIENT_ID,
        patientUserId: 'patient-user',
        therapistId: 'therapist-1',
        status: 'FINALIZED',
        amendedFromId: null,
        supersededAt: null,
        patientVisible: 1,
      },
    ];
    const record = await getTherapyProgressById(RECORD_ID);
    expect(record).toBeNull();
  });

  it('USER tidak dapat membaca rekam yang belum dibagikan (patientVisible = 0)', async () => {
    mocks.state.currentRole = 'USER';
    mocks.state.currentUserId = 'patient-user';
    mocks.state.rows.therapy_progress_records = [
      {
        id: RECORD_ID,
        patientId: PATIENT_ID,
        patientUserId: 'patient-user',
        therapistId: 'therapist-1',
        status: 'FINALIZED',
        amendedFromId: null,
        supersededAt: null,
        patientVisible: 0,
      },
    ];
    const record = await getTherapyProgressById(RECORD_ID);
    expect(record).toBeNull();
  });

  it('KONTROL POSITIF: USER dapat membaca rekam final miliknya yang dibagikan', async () => {
    mocks.state.currentRole = 'USER';
    mocks.state.currentUserId = 'patient-user';
    mocks.state.rows.therapy_progress_records = [
      {
        id: RECORD_ID,
        patientId: PATIENT_ID,
        patientUserId: 'patient-user',
        therapistId: 'therapist-1',
        status: 'FINALIZED',
        amendedFromId: null,
        supersededAt: null,
        patientVisible: 1,
      },
    ];
    const record = await getTherapyProgressById(RECORD_ID);
    expect(record?.id).toBe(RECORD_ID);
  });

  it('metadata lampiran kosong bila rekam di luar scope terapis', async () => {
    expect(await listRecordAttachmentMeta(RECORD_ID)).toEqual([]);
    expect(await fetchRecordAttachmentMeta(RECORD_ID)).toEqual([]);
  });

  it('KONTROL POSITIF: metadata lampiran terbaca dengan assignment aktif', async () => {
    mocks.state.rows.patient_assignments = [{ id: 'assignment-1', patientId: PATIENT_ID }];
    mocks.state.rows.patient_documents = [
      {
        id: DOCUMENT_ID,
        patientId: PATIENT_ID,
        therapyProgressRecordId: RECORD_ID,
        // `name` adalah hasil aliasing kolom original_filename pada select.
        name: 'foto-analisa.png',
        original_filename: 'foto-analisa.png',
        mimeType: 'image/png',
        sizeBytes: 2048,
        status: 'ACTIVE',
      },
    ];
    const meta = await listRecordAttachmentMeta(RECORD_ID);
    expect(meta).toEqual([{ id: DOCUMENT_ID, name: 'foto-analisa.png' }]);
  });

  it('melampirkan dokumen ditolak karena terapis tanpa assignment', async () => {
    const result = await attachDocumentToRecord(DOCUMENT_ID, RECORD_ID);
    expect(result).toEqual({
      ok: false,
      error: 'Anda hanya dapat mengubah pasien yang di-assign.',
    });
    // Tidak ada baris dokumen yang diubah.
    expect(mocks.state.updateCalls.filter((c) => c.tableName === 'patient_documents')).toHaveLength(0);
  });
});
