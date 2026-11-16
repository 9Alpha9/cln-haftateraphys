/**
 * Seed satu rekam medis dummy untuk QA tampilan pasien + PDF.
 * Hanya memakai akun *.dummy.hafta.test. Jalankan:
 *   ./node_modules/.bin/tsx --env-file-if-exists=.env scripts/qa/seed-qa-medical-record.ts
 */
import { and, eq } from 'drizzle-orm';
import { getDb } from '../../db';
import { patients, profiles, therapyProgressRecords, users } from '../../db/schema';

async function main() {
  const db = getDb();
  const [patientUser] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.email, 'patient1@dummy.hafta.test'))
    .limit(1);
  const [therapist] = await db
    .select({ id: users.id })
    .from(users)
    .innerJoin(profiles, eq(profiles.userId, users.id))
    .where(and(eq(users.email, 'therapist@dummy.hafta.test'), eq(profiles.accountType, 'THERAPIST')))
    .limit(1);
  if (!patientUser || !therapist) throw new Error('Dummy patient/therapist belum di-seed.');

  const [patient] = await db
    .select({ id: patients.id })
    .from(patients)
    .where(eq(patients.userId, patientUser.id))
    .limit(1);
  if (!patient) throw new Error('Patient record tidak ditemukan.');

  const [existing] = await db
    .select({ id: therapyProgressRecords.id })
    .from(therapyProgressRecords)
    .where(eq(therapyProgressRecords.patientId, patient.id))
    .limit(1);
  if (existing) {
    console.log(`QA record sudah ada: ${existing.id}`);
    return;
  }

  const [inserted] = await db
    .insert(therapyProgressRecords)
    .values({
      patientId: patient.id,
      therapistId: therapist.id,
      recordedAt: new Date('2026-11-10T09:00:00+07:00'),
      painScore: 4,
      rangeOfMotionScore: 7,
      strengthScore: 7,
      functionScore: 8,
      anamnesis:
        'Pasien mengeluh nyeri punggung bawah sejak mengangkat beban. Nyeri menjalar ke bokong kanan, memberat saat duduk lama.',
      physicalExamination:
        'Lumbal fleksi 60°, ekstensi 15°, nyeri tekan pada erector spinae kanan. Tes SLR negatif. Kekuatan otot 4/5.',
      medicalHistory: 'Riwayat nyeri punggung berulang. Tidak ada riwayat operasi.',
      diagnosis: 'Low back pain mekanik dengan keterbatasan mobilitas lumbal.',
      treatment: 'Mobilisasi lumbal, core stabilization, edukasi postur, dan modalitas panas.',
      evaluation: 'Nyeri menurun dari 6 menjadi 4. Toleransi latihan baik.',
      followUpPlan: 'Lanjutkan latihan di rumah 2×/hari. Evaluasi berikutnya 1 minggu.',
      summary: 'Sesi pertama berjalan baik, pasien kooperatif dan memahami edukasi postur.',
      patientVisible: 1,
      status: 'FINALIZED',
      finalizedAt: new Date('2026-11-10T10:00:00+07:00'),
      finalizedBy: therapist.id,
    })
    .returning({ id: therapyProgressRecords.id });

  console.log(`QA record dibuat: ${inserted.id}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
