'use server';

import { requireSession } from '@/lib/auth/require-session';
import { PERMISSIONS, hasPermission } from '@/lib/permissions';
import { getIntakeDetailForPdf, type IntakeHistoryPdfData } from '@/server/queries/patient-intakes';

export async function getIntakeForPdf(intakeId: string): Promise<IntakeHistoryPdfData | null> {
  const { session, role } = await requireSession({ redirectToLogin: true });
  if (!hasPermission(role, PERMISSIONS.INTAKE_READ)) return null;
  return getIntakeDetailForPdf(intakeId, session.user.id, role);
}
