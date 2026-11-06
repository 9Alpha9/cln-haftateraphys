import { z } from 'zod';

const requiredText = (label: string, max: number, minimum = 2) =>
  z.string().trim().min(minimum, `${label} wajib diisi.`).max(max);

const intakeFields = {
  chiefComplaint: requiredText('Keluhan utama', 2000, 10),
  affectedArea: requiredText('Area yang dikeluhkan', 200),
  onsetDescription: requiredText('Awal keluhan', 2000),
  triggeringEvent: requiredText('Kejadian atau aktivitas pemicu', 2000),
  aggravatingFactors: requiredText('Hal yang memperberat keluhan', 2000),
  relievingFactors: requiredText('Hal yang membantu meredakan', 2000),
  dailyLimitations: requiredText('Keterbatasan aktivitas', 2000, 10),
  previousInjuryHistory: requiredText('Riwayat cedera', 2000),
  surgeryHistory: requiredText('Riwayat operasi', 2000),
  relevantMedicalHistory: requiredText('Riwayat medis', 2000),
  currentMedication: requiredText('Obat yang sedang digunakan', 2000),
  allergies: requiredText('Alergi', 2000),
  patientGoal: requiredText('Target pasien', 1000, 10),
  photos: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(200),
        type: z.string().trim().min(1).max(100),
        size: z.number().int().positive().max(5 * 1024 * 1024, 'Ukuran foto maksimal 5 MB.'),
        data: z.string().min(20).max(3_000_000, 'Foto terlalu besar setelah diproses.'),
      }),
    )
    .max(4, 'Maksimal 4 foto.')
    .optional()
    .default([]),
  dataAccuracyAcknowledged: z.boolean().refine((value) => value, 'Konfirmasi ketepatan data diperlukan.'),
  privacyConsent: z.boolean().default(false),
  mediaConsent: z.boolean().default(false),
};

export const intakeDraftSchema = z.object(intakeFields);
export const intakeSubmitSchema = z.object({
  ...intakeFields,
  privacyConsent: z
    .boolean()
    .refine((value) => value, 'Persetujuan pemrosesan data pasien diperlukan sebelum mengirim.'),
});

export type IntakeDraftInput = z.infer<typeof intakeDraftSchema>;
