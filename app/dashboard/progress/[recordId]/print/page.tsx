import { notFound } from 'next/navigation';
import { getOwnMedicalRecordSummary, getTherapyProgressById } from '@/server/queries/therapy-progress';
import { requireSession } from '@/lib/auth/require-session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';
import { getHomeProgramForPatient, getOwnHomeProgram } from '@/server/queries/home-programs';
import { getOwnTreatmentPlan, getTreatmentPlanForPatient } from '@/server/queries/treatment-plans';
import { MedicalRecordPrintClient } from '@/components/pdf/medical-record-print-client';

export const dynamic = 'force-dynamic';

export default async function PrintMedicalRecordPage({
  params,
}: {
  params: Promise<{ recordId: string }>;
}) {
  const { recordId } = await params;
  const { session, role } = await requireSession({ redirectToLogin: true });
  if (role !== 'USER' && !hasPermission(role, PERMISSIONS.PATIENT_EXPORT)) notFound();

  const record = await getTherapyProgressById(recordId);
  if (!record) notFound();

  await createAuditLog({
    action: 'therapy_progress.export',
    targetType: 'therapy_progress',
    targetId: record.id,
    meta: { mode: 'print' },
    userId: session.user.id,
  });

  const isPatient = role === 'USER';
  const [patientSummary, treatmentPlan, homeProgram] = await Promise.all([
    isPatient ? getOwnMedicalRecordSummary() : Promise.resolve(null),
    isPatient ? getOwnTreatmentPlan() : getTreatmentPlanForPatient(record.patientId),
    isPatient ? getOwnHomeProgram() : getHomeProgramForPatient(record.patientId),
  ]);

  const pdfRecord = {
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

  return <MedicalRecordPrintClient record={pdfRecord} />;
}
