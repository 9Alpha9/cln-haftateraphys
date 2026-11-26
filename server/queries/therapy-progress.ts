import { and, asc, count, desc, eq, gt, gte, ilike, inArray, isNull, or, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import {
  appointmentRequests,
  appointments,
  patientAssignments,
  patientIntakes,
  patients,
  profiles,
  therapyProgressRecords,
  users,
} from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { ForbiddenError, hasPermission, PERMISSIONS } from '@/lib/permissions';

export type TherapyProgressView = {
  id: string;
  patientId: string;
  patientName: string;
  therapistName: string | null;
  recordedAt: Date;
  painScore: number;
  rangeOfMotionScore: number;
  strengthScore: number;
  functionScore: number;
  anamnesis: string | null;
  physicalExamination: string | null;
  medicalHistory: string | null;
  diagnosis: string | null;
  treatment: string | null;
  evaluation: string | null;
  followUpPlan: string | null;
  summary: string | null;
  status: 'DRAFT' | 'FINALIZED';
  patientVisible: boolean;
  amendedFromId?: string | null;
  revisionNumber?: number;
  amendmentReason?: string | null;
  supersededAt?: Date | null;
  medicalRecordNumber?: string | null;
  visitNumber?: number;
  gender?: string | null;
  patientDob?: Date | null;
  patientPhone?: string | null;
  patientAddress?: string | null;
  patientAvatarKey?: string | null;
  occupation?: string | null;
};

export type TherapyProgressDetail = TherapyProgressView & {
  /** Versi data; dipakai untuk cache render PDF. */
  updatedAt: Date;
  medicalRecordNumber: string | null;
  gender: string | null;
  patientDob: Date | null;
  patientPhone: string | null;
  patientAddress: string | null;
};

export async function getTherapyProgressById(id: string): Promise<TherapyProgressDetail | null> {
  const { session, role } = await requireSession({ redirectToLogin: true });
  const permission = role === 'USER' ? PERMISSIONS.PROGRESS_READ_OWN : PERMISSIONS.PROGRESS_READ;
  if (!hasPermission(role, permission)) throw new ForbiddenError();

  const db = getDb();
  const [row] = await db
    .select({
      id: therapyProgressRecords.id,
      patientId: therapyProgressRecords.patientId,
      patientUserId: patients.userId,
      therapistId: therapyProgressRecords.therapistId,
      patientName: patients.fullName,
      patientAvatarKey: profiles.avatarKey,
      medicalRecordNumber: patients.medicalRecordNumber,
      visitNumber: sql<number>`(
        select count(*)::int + 1
        from ${therapyProgressRecords} as prior
        where prior.patient_id = ${therapyProgressRecords.patientId}
          and prior.amended_from_id is null
          and prior.recorded_at < ${therapyProgressRecords.recordedAt}
      )`,
      gender: patients.gender,
      patientDob: patients.dateOfBirth,
      patientPhone: profiles.phone,
      patientAddress: patients.addressLine,
      patientCity: patients.addressCity,
      occupation: patients.occupation,
      therapistName: users.name,
      recordedAt: therapyProgressRecords.recordedAt,
      painScore: therapyProgressRecords.painScore,
      rangeOfMotionScore: therapyProgressRecords.rangeOfMotionScore,
      strengthScore: therapyProgressRecords.strengthScore,
      functionScore: therapyProgressRecords.functionScore,
      anamnesis: therapyProgressRecords.anamnesis,
      physicalExamination: therapyProgressRecords.physicalExamination,
      medicalHistory: sql<string | null>`coalesce(${therapyProgressRecords.medicalHistory}, (
        select ${patientIntakes.relevantMedicalHistory}
        from ${patientIntakes}
        where ${patientIntakes.patientId} = ${therapyProgressRecords.patientId}
        order by ${patientIntakes.version} desc
        limit 1
      ))`,
      diagnosis: therapyProgressRecords.diagnosis,
      treatment: therapyProgressRecords.treatment,
      evaluation: therapyProgressRecords.evaluation,
      followUpPlan: therapyProgressRecords.followUpPlan,
      summary: therapyProgressRecords.summary,
      status: therapyProgressRecords.status,
      patientVisible: therapyProgressRecords.patientVisible,
      amendedFromId: therapyProgressRecords.amendedFromId,
      revisionNumber: therapyProgressRecords.revisionNumber,
      amendmentReason: therapyProgressRecords.amendmentReason,
      supersededAt: therapyProgressRecords.supersededAt,
      updatedAt: therapyProgressRecords.updatedAt,
    })
    .from(therapyProgressRecords)
    .innerJoin(patients, eq(therapyProgressRecords.patientId, patients.id))
    .innerJoin(users, eq(therapyProgressRecords.therapistId, users.id))
    .leftJoin(profiles, eq(profiles.userId, patients.userId))
    .where(eq(therapyProgressRecords.id, id))
    .limit(1);

  if (!row) return null;

  if (
    role === 'USER' &&
    (row.patientUserId !== session.user.id ||
      row.status !== 'FINALIZED' ||
      row.patientVisible !== 1 ||
      row.supersededAt)
  ) {
    return null;
  }

  if (role === 'THERAPIST') {
    // Scope terapis selalu mengikuti assignment aktif, termasuk saat membuka
    // rekam yang pernah ia tulis sebelum assignment berakhir.
    const [assignment] = await db
      .select({ id: patientAssignments.id })
      .from(patientAssignments)
      .where(
        and(
          eq(patientAssignments.patientId, row.patientId),
          eq(patientAssignments.staffUserId, session.user.id),
          isNull(patientAssignments.activeUntil),
        ),
      )
      .limit(1);

    if (!assignment) return null;
  }

  const { patientUserId: _, therapistId: __, patientCity, patientAddress, ...record } = row;
  const fullAddress = [patientAddress, patientCity].filter(Boolean).join(', ') || null;
  return {
    ...record,
    patientAddress: fullAddress,
    patientVisible: record.patientVisible === 1,
  };
}

export type PatientNextSchedule = {
  /** Sumber jadwal: sesi aktif, pengajuan baru, pengajuan ubah jadwal, atau input manual. */
  source: 'APPOINTMENT' | 'PENDING_REQUEST' | 'PENDING_RESCHEDULE' | 'MANUAL';
  dateAt: Date;
  /** Jam mulai dalam format `HH:MM`. */
  timeText: string;
  therapistName: string | null;
  /** Label status ramah pasien, mis. "Terjadwal", "Menunggu Konfirmasi". */
  statusLabel: string;
  /** Jadwal lama yang sedang diajukan untuk diubah (hanya untuk PENDING_RESCHEDULE). */
  previousDateAt: Date | null;
  previousTimeText: string | null;
};

export type PatientMedicalRecordSummary = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  gender: string | null;
  medicalRecordNumber: string | null;
  dateOfBirth: Date | null;
  addressCity: string | null;
  addressProvince: string | null;
  addressLine: string | null;
  caseStatus: string;
  therapyGoal: string | null;
  therapyDiagnosisLabel: string | null;
  therapyFrequencyText: string | null;
  nextTherapyAt: Date | null;
  /** Jadwal berikutnya ter-resolve dari appointment aktif + pengajuan PENDING. */
  nextSchedule: PatientNextSchedule | null;
  therapistNote: string | null;
  therapistNoteAuthor: string | null;
  therapistNoteAt: Date | null;
  therapistName: string | null;
  preferredName: string | null;
  occupation: string | null;
  emergencyContactName: string | null;
  emergencyContactRelationship: string | null;
  emergencyContactPhone: string | null;
  avatarKey: string | null;
};

export async function getOwnMedicalRecordSummary(): Promise<PatientMedicalRecordSummary | null> {
  const { session, role } = await requireSession({ redirectToLogin: true });
  if (role !== 'USER' || !hasPermission(role, PERMISSIONS.PROGRESS_READ_OWN)) return null;

  const db = getDb();
  const [patient] = await db
    .select({
      id: patients.id,
      fullName: patients.fullName,
      email: users.email,
      phone: profiles.phone,
      gender: patients.gender,
      medicalRecordNumber: patients.medicalRecordNumber,
      dateOfBirth: patients.dateOfBirth,
      addressCity: patients.addressCity,
      addressProvince: patients.addressProvince,
      addressLine: patients.addressLine,
      caseStatus: patients.caseStatus,
      therapyGoal: patients.therapyGoal,
      therapyDiagnosisLabel: patients.therapyDiagnosisLabel,
      therapyFrequencyText: patients.therapyFrequencyText,
      nextTherapyAt: patients.nextTherapyAt,
      therapistNote: patients.therapistNote,
      therapistNoteAuthor: patients.therapistNoteAuthor,
      therapistNoteAt: patients.therapistNoteAt,
      preferredName: profiles.displayName,
      occupation: patients.occupation,
      emergencyContactName: patients.emergencyContactName,
      emergencyContactRelationship: patients.emergencyContactRelationship,
      emergencyContactPhone: patients.emergencyContactPhone,
      avatarKey: profiles.avatarKey,
    })
    .from(patients)
    .innerJoin(users, eq(patients.userId, users.id))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(patients.userId, session.user.id))
    .limit(1);

  if (!patient) return null;

  const [assignment] = await db
    .select({ therapistName: users.name })
    .from(patientAssignments)
    .innerJoin(users, eq(patientAssignments.staffUserId, users.id))
    .where(and(eq(patientAssignments.patientId, patient.id), isNull(patientAssignments.activeUntil)))
    .orderBy(desc(patientAssignments.activeFrom))
    .limit(1);

  const nextSchedule = await resolveNextSchedule(
    db,
    patient.id,
    patient.nextTherapyAt,
    assignment?.therapistName ?? null,
  );

  return { ...patient, therapistName: assignment?.therapistName ?? null, nextSchedule };
}

/** Kunci tanggal lokal `YYYY-MM-DD` (konsisten dengan next-therapy-sync & appointment-requests). */
function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function localTimeText(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function parseDateKey(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

type DbClient = ReturnType<typeof getDb>;

/**
 * Tentukan "jadwal berikutnya" bagi pasien dari TIGA sumber, dengan prioritas:
 * 1. Pengajuan ubah jadwal PENDING (`rescheduleAppointmentId` terisi) — jadwal
 *    sedang dalam proses perubahan, tampilkan tanggal barunya beserta catatan
 *    jadwal semula agar pasien tidak bingung.
 * 2. Pengajuan jadwal baru PENDING — slot sudah dipilih, menunggu persetujuan.
 * 3. Appointment aktif terdekat (SCHEDULED/CONFIRMED) yang belum berlalu.
 * 4. Fallback ke `patients.nextTherapyAt` (input manual / historis).
 */
async function resolveNextSchedule(
  db: DbClient,
  patientId: string,
  manualNextTherapyAt: Date | null,
  fallbackTherapistName: string | null,
): Promise<PatientNextSchedule | null> {
  const now = new Date();
  const todayKey = localDateKey(now);
  const nowTimeText = localTimeText(now);

  const [pendingRequest] = await db
    .select({
      requestedDate: appointmentRequests.requestedDate,
      startTime: appointmentRequests.startTime,
      therapistName: users.name,
      rescheduleAppointmentId: appointmentRequests.rescheduleAppointmentId,
    })
    .from(appointmentRequests)
    .innerJoin(users, eq(appointmentRequests.therapistId, users.id))
    .where(
      and(
        eq(appointmentRequests.patientId, patientId),
        eq(appointmentRequests.status, 'PENDING'),
        gte(appointmentRequests.requestedDate, todayKey),
      ),
    )
    .orderBy(asc(appointmentRequests.requestedDate), asc(appointmentRequests.startTime))
    .limit(1);

  if (pendingRequest) {
    let previous: { scheduledDate: string; startTime: string } | null = null;
    if (pendingRequest.rescheduleAppointmentId) {
      const [source] = await db
        .select({ scheduledDate: appointments.scheduledDate, startTime: appointments.startTime })
        .from(appointments)
        .where(eq(appointments.id, pendingRequest.rescheduleAppointmentId))
        .limit(1);
      previous = source ?? null;
    }
    return {
      source: pendingRequest.rescheduleAppointmentId ? 'PENDING_RESCHEDULE' : 'PENDING_REQUEST',
      dateAt: parseDateKey(pendingRequest.requestedDate),
      timeText: pendingRequest.startTime.slice(0, 5),
      therapistName: pendingRequest.therapistName,
      statusLabel: pendingRequest.rescheduleAppointmentId ? 'Pengajuan Ubah Jadwal' : 'Menunggu Konfirmasi',
      previousDateAt: previous ? parseDateKey(previous.scheduledDate) : null,
      previousTimeText: previous ? previous.startTime.slice(0, 5) : null,
    };
  }

  // Sesi hari ini yang jam mulainya sudah lewat tidak lagi disebut "berikutnya".
  const [nextAppointment] = await db
    .select({
      scheduledDate: appointments.scheduledDate,
      startTime: appointments.startTime,
      therapistName: users.name,
    })
    .from(appointments)
    .innerJoin(users, eq(appointments.therapistId, users.id))
    .where(
      and(
        eq(appointments.patientId, patientId),
        inArray(appointments.status, ['SCHEDULED', 'CONFIRMED']),
        or(
          gt(appointments.scheduledDate, todayKey),
          and(eq(appointments.scheduledDate, todayKey), gte(appointments.startTime, nowTimeText)),
        ),
      ),
    )
    .orderBy(asc(appointments.scheduledDate), asc(appointments.startTime))
    .limit(1);

  if (nextAppointment) {
    return {
      source: 'APPOINTMENT',
      dateAt: parseDateKey(nextAppointment.scheduledDate),
      timeText: nextAppointment.startTime.slice(0, 5),
      therapistName: nextAppointment.therapistName,
      statusLabel: 'Terjadwal',
      previousDateAt: null,
      previousTimeText: null,
    };
  }

  if (manualNextTherapyAt) {
    return {
      source: 'MANUAL',
      dateAt: manualNextTherapyAt,
      timeText: localTimeText(manualNextTherapyAt),
      therapistName: fallbackTherapistName,
      statusLabel: 'Terjadwal',
      previousDateAt: null,
      previousTimeText: null,
    };
  }

  return null;
}

export type GetProgressOptions = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: 'DRAFT' | 'FINALIZED' | '';
  patientVisible?: boolean | '';
  patientId?: string;
};

export async function getScopedTherapyProgress(
  options: GetProgressOptions = {},
): Promise<{ items: TherapyProgressView[]; total: number; currentPage: number; totalPages: number }> {
  const { page = 1, pageSize = 10, search = '', status = '', patientVisible = '', patientId } = options;

  const { session, role } = await requireSession({ redirectToLogin: true });
  const permission = role === 'USER' ? PERMISSIONS.PROGRESS_READ_OWN : PERMISSIONS.PROGRESS_READ;
  if (!hasPermission(role, permission)) throw new ForbiddenError();

  const db = getDb();
  const isPatient = role === 'USER';

  const baseQuery = db
    .selectDistinct({
      id: therapyProgressRecords.id,
      patientId: therapyProgressRecords.patientId,
      patientName: patients.fullName,
      patientAvatarKey: profiles.avatarKey,
      medicalRecordNumber: patients.medicalRecordNumber,
      visitNumber: sql<number>`(
        select count(*)::int + 1
        from ${therapyProgressRecords} as prior
        where prior.patient_id = ${therapyProgressRecords.patientId}
          and prior.amended_from_id is null
          and prior.recorded_at < ${therapyProgressRecords.recordedAt}
      )`,
      gender: patients.gender,
      patientDob: patients.dateOfBirth,
      patientPhone: profiles.phone,
      patientAddress: patients.addressLine,
      occupation: patients.occupation,
      therapistName: users.name,
      recordedAt: therapyProgressRecords.recordedAt,
      painScore: therapyProgressRecords.painScore,
      rangeOfMotionScore: therapyProgressRecords.rangeOfMotionScore,
      strengthScore: therapyProgressRecords.strengthScore,
      functionScore: therapyProgressRecords.functionScore,
      anamnesis: therapyProgressRecords.anamnesis,
      physicalExamination: therapyProgressRecords.physicalExamination,
      medicalHistory: sql<string | null>`coalesce(${therapyProgressRecords.medicalHistory}, (
        select ${patientIntakes.relevantMedicalHistory}
        from ${patientIntakes}
        where ${patientIntakes.patientId} = ${therapyProgressRecords.patientId}
        order by ${patientIntakes.version} desc
        limit 1
      ))`,
      diagnosis: therapyProgressRecords.diagnosis,
      treatment: therapyProgressRecords.treatment,
      evaluation: therapyProgressRecords.evaluation,
      followUpPlan: therapyProgressRecords.followUpPlan,
      summary: therapyProgressRecords.summary,
      status: therapyProgressRecords.status,
      patientVisible: therapyProgressRecords.patientVisible,
      amendedFromId: therapyProgressRecords.amendedFromId,
      revisionNumber: therapyProgressRecords.revisionNumber,
      amendmentReason: therapyProgressRecords.amendmentReason,
      supersededAt: therapyProgressRecords.supersededAt,
    })
    .from(therapyProgressRecords)
    .innerJoin(patients, eq(therapyProgressRecords.patientId, patients.id))
    .innerJoin(users, eq(therapyProgressRecords.therapistId, users.id))
    .leftJoin(profiles, eq(profiles.userId, patients.userId))
    .leftJoin(
      patientAssignments,
      and(eq(patientAssignments.patientId, patients.id), isNull(patientAssignments.activeUntil)),
    );

  let scopeFilter;

  if (isPatient) {
    scopeFilter = eq(patients.userId, session.user.id);
  } else if (role === 'THERAPIST') {
    // Hanya pasien dengan assignment aktif. Rekam lama tetap tersedia bila
    // pasien di-assign kembali, tetapi tidak terbuka setelah assignment berakhir.
    // `activeUntil` wajib ikut di filter (bukan hanya di JOIN) agar query hitung
    // total memakai scope yang sama dengan query data.
    scopeFilter = and(eq(patientAssignments.staffUserId, session.user.id), isNull(patientAssignments.activeUntil));
  }

  const filters = [scopeFilter, isNull(therapyProgressRecords.supersededAt)];
  if (isPatient) {
    filters.push(eq(therapyProgressRecords.status, 'FINALIZED'));
    filters.push(eq(therapyProgressRecords.patientVisible, 1));
  } else {
    if (status) filters.push(eq(therapyProgressRecords.status, status));
    if (patientVisible !== '') filters.push(eq(therapyProgressRecords.patientVisible, patientVisible ? 1 : 0));
  }
  if (patientId) filters.push(eq(therapyProgressRecords.patientId, patientId));
  if (search.trim()) {
    const term = `%${search.trim()}%`;
    filters.push(
      or(
        ilike(patients.fullName, term),
        ilike(patients.medicalRecordNumber, term),
        ilike(therapyProgressRecords.diagnosis, term),
        ilike(therapyProgressRecords.anamnesis, term),
        ilike(therapyProgressRecords.treatment, term),
        ilike(users.name, term),
      ),
    );
  }

  const whereClause = and(...filters);

  const currentPage = Math.max(1, page);
  const limit = pageSize;

  const [totalResult] = await db
    .select({ value: count() })
    .from(therapyProgressRecords)
    .innerJoin(patients, eq(therapyProgressRecords.patientId, patients.id))
    .innerJoin(users, eq(therapyProgressRecords.therapistId, users.id))
    .leftJoin(patientAssignments, eq(patientAssignments.patientId, patients.id))
    .where(whereClause);

  const total = totalResult.value;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(currentPage, totalPages);

  const rows = await baseQuery
    .where(whereClause)
    .orderBy(desc(therapyProgressRecords.recordedAt))
    .limit(limit)
    .offset((safePage - 1) * limit);

  return {
    items: rows.map((row) => ({ ...row, patientVisible: row.patientVisible === 1 })),
    total,
    currentPage: safePage,
    totalPages,
  };
}
