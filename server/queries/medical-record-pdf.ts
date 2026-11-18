import { requireSession } from '@/lib/auth/require-session';
import type { MedicalRecordPdfData } from '@/components/pdf/medical-record-document';
import {
  getOwnMedicalRecordSummary,
  getTherapyProgressById,
  type TherapyProgressDetail,
} from '@/server/queries/therapy-progress';
import { getHomeProgramForPatient, getOwnHomeProgram } from '@/server/queries/home-programs';
import { getOwnTreatmentPlan, getTreatmentPlanForPatient } from '@/server/queries/treatment-plans';

export type MedicalRecordPdfSource = {
  record: TherapyProgressDetail;
  pdfRecord: MedicalRecordPdfData;
};

/**
 * Menyiapkan data PDF rekam medis (identitas, info terapi, rencana terapi, dan
 * program latihan) dari satu tempat agar halaman cetak dan endpoint PDF selalu
 * identik. Mengembalikan `null` bila rekam tidak ada atau di luar scope pengguna
 * (scope ditegakkan oleh `getTherapyProgressById`).
 */
export async function buildMedicalRecordPdfSource(
  recordId: string,
): Promise<MedicalRecordPdfSource | null> {
  const { role } = await requireSession({ redirectToLogin: false });
  const record = await getTherapyProgressById(recordId);
  if (!record) return null;

  const isPatient = role === 'USER';
  const [patientSummary, treatmentPlan, homeProgram] = await Promise.all([
    isPatient ? getOwnMedicalRecordSummary() : Promise.resolve(null),
    isPatient ? getOwnTreatmentPlan() : getTreatmentPlanForPatient(record.patientId),
    isPatient ? getOwnHomeProgram() : getHomeProgramForPatient(record.patientId),
  ]);

  const pdfRecord: MedicalRecordPdfData = {
    ...record,
    recordedAt: new Date(record.recordedAt),
    therapyInfo: {
      visitNumber: record.visitNumber ?? null,
      status: record.status,
      patientVisible: record.patientVisible,
      nextTherapyAt: patientSummary?.nextTherapyAt ?? null,
      frequencyText: patientSummary?.therapyFrequencyText ?? null,
      therapyGoal: patientSummary?.therapyGoal ?? null,
      diagnosisLabel: patientSummary?.therapyDiagnosisLabel ?? null,
    },
    treatmentPlan: treatmentPlan
      ? {
          goals: treatmentPlan.goals,
          interventions: treatmentPlan.interventions,
          reviewIntervalText: treatmentPlan.reviewIntervalText,
          precautions: treatmentPlan.precautions,
          status: treatmentPlan.status,
        }
      : null,
    homeProgram: homeProgram
      ? {
          status: homeProgram.status,
          startsAt: homeProgram.startsAt,
          endsAt: homeProgram.endsAt,
          items: homeProgram.items.map((item) => ({
            name: item.name,
            instruction: item.instruction,
            sets: item.sets,
            repetitions: item.repetitions,
            durationSeconds: item.durationSeconds,
            frequencyText: item.frequencyText,
            precaution: item.precaution,
          })),
        }
      : null,
  };

  return { record, pdfRecord };
}
