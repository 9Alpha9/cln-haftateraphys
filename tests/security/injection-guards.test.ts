import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { intakeDraftSchema, intakeSubmitSchema } from '@/lib/validators/patient-intake';
import { intakeReviewSchema } from '@/lib/validators/intake-review';
import { patientProfileSchema } from '@/lib/validators/patient-profile';
import { internalCalendarEventSchema } from '@/lib/validators/internal-calendar-event';

/**
 * Pengujian injeksi & validasi input (audit v2.0 — Fase 3).
 *
 * Cakupan:
 *  - Prototype pollution lewat payload form JSON.
 *  - Batas panjang field teks bebas (mencegah payload XSS/stored abuse masuk
 *    ke database, PDF, dan notifikasi).
 *  - Karakter khusus SQL tetap diperlakukan sebagai data (parameterisasi
 *    drizzle diverifikasi terpisah lewat audit statis: semua pemakaian sql``
 *    hanya men-interpolasi kolom/parameter terikat).
 *  - Markup HTML diterima sebagai STRING biasa oleh schema — perlindungan
 *    eksekusi di lapisan render (React auto-escape), bukan di validator.
 */

const VALID_INTAKE = {
  chiefComplaint: 'Nyeri bahu kanan sejak 3 minggu lalu',
  affectedArea: 'Bahu kanan',
  onsetDescription: 'Perlahan sejak mengangkat beban berat',
  triggeringEvent: 'Mengangkat kotak di gudang',
  aggravatingFactors: 'Mengangkat tangan di atas kepala',
  relievingFactors: 'Istirahat dan kompres hangat',
  dailyLimitations: 'Sulit mengenakan baju dan menyisir rambut',
  previousInjuryHistory: 'Tidak ada',
  surgeryHistory: 'Tidak ada',
  relevantMedicalHistory: 'Tidak ada',
  currentMedication: 'Tidak ada',
  allergies: 'Tidak ada',
  patientGoal: 'Kembali beraktivitas tanpa nyeri',
  dataAccuracyAcknowledged: true,
};

describe('prototype pollution via payload form', () => {
  it('intakeDraftSchema mengabaikan key __proto__ dan tidak mempolusi Object.prototype', () => {
    const malicious = JSON.parse(
      `{"__proto__":{"isAdmin":true},"constructor":{"prototype":{"isAdmin":true}},"chiefComplaint":"${VALID_INTAKE.chiefComplaint}","affectedArea":"Bahu kanan","onsetDescription":"Perlahan sejak mengangkat beban berat","triggeringEvent":"Mengangkat kotak","aggravatingFactors":"Mengangkat tangan","relievingFactors":"Istirahat","dailyLimitations":"Sulit mengenakan baju","previousInjuryHistory":"Tidak ada","surgeryHistory":"Tidak ada","relevantMedicalHistory":"Tidak ada","currentMedication":"Tidak ada","allergies":"Tidak ada","patientGoal":"Kembali beraktivitas","dataAccuracyAcknowledged":true}`,
    );

    const parsed = intakeDraftSchema.parse(malicious);

    expect((parsed as Record<string, unknown>).isAdmin).toBeUndefined();
    expect(({} as Record<string, unknown>).isAdmin).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(parsed, '__proto__')).toBe(false);
  });

  it('patientProfileSchema menghapus key tak dikenal termasuk properti berbahaya', () => {
    const malicious = JSON.parse(
      '{"fullName":"Pasien Dummy","__proto__":{"role":"SUPER_ADMIN"},"role":"SUPER_ADMIN","phone":"08123456789"}',
    );

    const parsed = patientProfileSchema.parse(malicious);

    expect((parsed as Record<string, unknown>).role).toBeUndefined();
    // JSON.parse membuat own-property "__proto__"; zod harus membuangnya sehingga
    // objek hasil parse tidak punya own-property tersebut.
    expect(Object.prototype.hasOwnProperty.call(parsed, '__proto__')).toBe(false);
    expect(Object.getPrototypeOf(parsed)).toBe(Object.prototype);
    expect(({} as Record<string, unknown>).role).toBeUndefined();
  });
});

describe('batas panjang field teks bebas', () => {
  it('menolak keluhan utama melebihi 2000 karakter', () => {
    const result = intakeDraftSchema.safeParse({
      ...VALID_INTAKE,
      chiefComplaint: 'x'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('menolak keluhan utama kurang dari 10 karakter (wajib bermakna)', () => {
    const result = intakeDraftSchema.safeParse({ ...VALID_INTAKE, chiefComplaint: 'sakit' });
    expect(result.success).toBe(false);
  });

  it('menerima tepat 2000 karakter (batas inklusif)', () => {
    const result = intakeDraftSchema.safeParse({
      ...VALID_INTAKE,
      chiefComplaint: 'x'.repeat(2000),
    });
    expect(result.success).toBe(true);
  });

  it('menolak nama pasien lebih dari 200 karakter', () => {
    const result = patientProfileSchema.safeParse({
      fullName: 'N'.repeat(201),
      phone: '08123456789',
    });
    expect(result.success).toBe(false);
  });

  it('menolak pesan review intake lebih dari 1000 karakter', () => {
    const result = intakeReviewSchema.safeParse({
      patientId: '11111111-1111-4111-8111-111111111111',
      action: 'request-revision',
      reviewMessage: 'y'.repeat(1001),
    });
    expect(result.success).toBe(false);
  });

  it('menolak pesan review request-revision tanpa isi minimal 5 karakter', () => {
    const result = intakeReviewSchema.safeParse({
      patientId: '11111111-1111-4111-8111-111111111111',
      action: 'request-revision',
      reviewMessage: 'ok',
    });
    expect(result.success).toBe(false);
  });
});

describe('validasi format & enum (mencegah nilai tak terduga masuk)', () => {
  it('menolak nomor telepon yang mengandung karakter non-digit', () => {
    for (const phone of ['0812-3456-789', "0812' OR 1=1--", '08123456789012345']) {
      const result = patientProfileSchema.safeParse({ fullName: 'Pasien Dummy', phone });
      expect(result.success, phone).toBe(false);
    }
  });

  it('menerima nomor telepon Indonesia yang valid', () => {
    const result = patientProfileSchema.safeParse({ fullName: 'Pasien Dummy', phone: '08123456789' });
    expect(result.success).toBe(true);
  });

  it('membatasi enum aksi review ke nilai yang diizinkan', () => {
    for (const action of ["accept'; DROP TABLE patients; --", 'delete', '']) {
      const result = intakeReviewSchema.safeParse({
        patientId: '11111111-1111-4111-8111-111111111111',
        action,
      });
      expect(result.success, action).toBe(false);
    }
  });

  it('membatasi enum jenis internal calendar event', () => {
    const result = internalCalendarEventSchema.safeParse({
      title: 'Libur Klinik',
      eventType: 'NOT_A_TYPE',
      scheduledDate: '2026-12-25',
      startTime: '09:00',
      endTime: '17:00',
      patientVisible: false,
    });
    expect(result.success).toBe(false);

    const valid = internalCalendarEventSchema.safeParse({
      title: 'Libur Klinik',
      eventType: 'CLINIC_CLOSURE',
      scheduledDate: '2026-12-25',
      startTime: '09:00',
      endTime: '17:00',
      patientVisible: false,
    });
    expect(valid.success).toBe(true);
  });

  it('membatasi jumlah foto intake maksimal 4 dan ukuran 5 MB', () => {
    const photo = {
      name: 'hasil.jpg',
      type: 'image/jpeg',
      size: 5 * 1024 * 1024 + 1,
      data: 'A'.repeat(64),
    };
    const tooBig = intakeSubmitSchema.safeParse({
      ...VALID_INTAKE,
      dataAccuracyAcknowledged: true,
      privacyConsent: true,
      photos: [photo, photo, photo, photo],
    });
    expect(tooBig.success).toBe(false);

    const tooMany = intakeSubmitSchema.safeParse({
      ...VALID_INTAKE,
      dataAccuracyAcknowledged: true,
      privacyConsent: true,
      photos: [photo, photo, photo, photo, photo].map((p) => ({ ...p, size: 1024 })),
    });
    expect(tooMany.success).toBe(false);
  });
});

describe('markup HTML diperlakukan sebagai data, bukan instruksi', () => {
  it('payload XSS tersimpan sebagai string biasa (dieksekusi oleh render, bukan validator)', () => {
    const xss = '<img src=x onerror="alert(document.cookie)">';
    const result = intakeDraftSchema.safeParse({ ...VALID_INTAKE, patientGoal: xss });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.patientGoal).toBe(xss);
      // Tidak ada transformasi yang mengubahnya jadi struktur HTML.
      expect(typeof result.data.patientGoal).toBe('string');
    }
  });

  it('payload SQL tetap diperlakukan sebagai string data biasa', () => {
    const sqli = "'; DROP TABLE therapy_progress_records; --";
    const result = patientProfileSchema.safeParse({ fullName: sqli });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.fullName).toBe(sqli);
  });

  it('intake submit menolak tanpa konfirmasi keakuratan data & persetujuan privasi', () => {
    const result = intakeSubmitSchema.safeParse({
      ...VALID_INTAKE,
      dataAccuracyAcknowledged: false,
      privacyConsent: false,
    });
    expect(result.success).toBe(false);
  });
});

// Penjaga kontrak schema: bila seseorang menambah field baru tanpa batas,
// tes ini mengingatkan agar keputusannya disengaja.
describe('penjaga kontrak', () => {
  it('semua schema bersifat strict-object (membuang key tak dikenal)', () => {
    const schemas: z.ZodType[] = [
      intakeDraftSchema,
      intakeReviewSchema,
      patientProfileSchema,
      internalCalendarEventSchema,
    ];
    for (const schema of schemas) {
      const parsed = schema.safeParse({ unknownKey: 'should-be-stripped', ...VALID_INTAKE });
      // Key tak dikenal tidak boleh muncul di hasil parse schema object.
      if (parsed.success) {
        expect((parsed.data as Record<string, unknown>).unknownKey).toBeUndefined();
      }
    }
  });
});
