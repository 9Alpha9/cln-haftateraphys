'use server';

import { ForbiddenError, hasPermission, PERMISSIONS } from '@/lib/permissions';
import { requireSession } from '@/lib/auth/require-session';
import { getPatientDetail } from '@/server/queries/patient-detail';
import { getTherapistOptions } from '@/server/queries/patients';
import { getHomeProgramForPatient } from '@/server/queries/home-programs';
import { getTreatmentPlanForPatient } from '@/server/queries/treatment-plans';
import { getScopedTherapyProgress } from '@/server/queries/therapy-progress';
import { getScopedIntakeForReview } from '@/server/queries/intake-review';
import { getPatientConsentsForStaff } from '@/server/queries/consents';

export async function fetchPatientDetailAction(patientId: string) {
  try {
    const { role } = await requireSession({ redirectToLogin: false });
    if (!hasPermission(role, PERMISSIONS.PATIENT_READ)) {
      return { ok: false as const, error: 'Anda tidak memiliki akses ke data pasien.' };
    }

    const detail = await getPatientDetail(patientId);
    const canAssignTherapist = role !== 'USER' && hasPermission(role, PERMISSIONS.PATIENT_ASSIGN);
    const therapistOptions = canAssignTherapist ? await getTherapistOptions() : [];
    const canReadProgress = hasPermission(role, PERMISSIONS.PROGRESS_READ);
    const canReadConsent = hasPermission(role, PERMISSIONS.CONSENT_READ);
    const [progress, homeProgram, treatmentPlan, consents] = await Promise.all([
      canReadProgress
        ? getScopedTherapyProgress({ patientId, pageSize: 50 })
        : Promise.resolve({ items: [] }),
      canReadProgress ? getHomeProgramForPatient(patientId) : Promise.resolve(null),
      canReadProgress ? getTreatmentPlanForPatient(patientId) : Promise.resolve(null),
      canReadConsent ? getPatientConsentsForStaff(patientId).catch(() => []) : Promise.resolve([]),
    ]);
    let intake = null;
    if (hasPermission(role, PERMISSIONS.INTAKE_READ)) {
      try {
        intake = await getScopedIntakeForReview(patientId);
      } catch (error) {
        if (!(error instanceof ForbiddenError)) throw error;
      }
    }

    return {
      ok: true as const,
      data: {
        ...detail,
        progress: progress.items,
        homeProgram,
        treatmentPlan,
        consents,
        intake,
        therapistOptions,
        capabilities: {
          canEditSchedule:
            role !== 'USER' &&
            (hasPermission(role, PERMISSIONS.PATIENT_UPDATE_DEMOGRAPHICS) ||
              hasPermission(role, PERMISSIONS.INTAKE_REVIEW)),
          canEditRecord: role !== 'USER' && hasPermission(role, PERMISSIONS.PROGRESS_READ),
          canCreateAppointment: role !== 'USER' && hasPermission(role, PERMISSIONS.APPOINTMENT_CREATE),
          canCompleteProgram: role !== 'USER' && hasPermission(role, PERMISSIONS.PATIENT_COMPLETE_PROGRAM),
          canAssignTherapist,
        },
      },
    };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : 'Data pasien tidak dapat dimuat.',
    };
  }
}
