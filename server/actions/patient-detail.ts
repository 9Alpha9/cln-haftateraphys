'use server';

import { ForbiddenError, hasPermission, PERMISSIONS } from '@/lib/permissions';
import { requireSession } from '@/lib/auth/require-session';
import { getPatientDetail } from '@/server/queries/patient-detail';
import { getScopedTherapyProgress } from '@/server/queries/therapy-progress';
import { getScopedIntakeForReview } from '@/server/queries/intake-review';

export async function fetchPatientDetailAction(patientId: string) {
  try {
    const { role } = await requireSession({ redirectToLogin: false });
    if (!hasPermission(role, PERMISSIONS.PATIENT_READ)) {
      return { ok: false as const, error: 'Anda tidak memiliki akses ke data pasien.' };
    }

    const detail = await getPatientDetail(patientId);
    const progress = await getScopedTherapyProgress({ patientId, pageSize: 50 });
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
        intake,
        capabilities: {
          canEditSchedule:
            role !== 'USER' &&
            (hasPermission(role, PERMISSIONS.PATIENT_UPDATE_DEMOGRAPHICS) ||
              hasPermission(role, PERMISSIONS.INTAKE_REVIEW)),
          canEditRecord: role !== 'USER' && hasPermission(role, PERMISSIONS.PROGRESS_READ),
          canCreateAppointment: role !== 'USER' && hasPermission(role, PERMISSIONS.APPOINTMENT_CREATE),
          canCompleteProgram: role !== 'USER' && hasPermission(role, PERMISSIONS.PATIENT_COMPLETE_PROGRAM),
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
