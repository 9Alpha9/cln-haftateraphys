'use server';

import { requireSession } from '@/lib/auth/require-session';
import { PERMISSIONS, hasPermission } from '@/lib/permissions';
import { getIntakeDetailForPdf, type IntakeHistoryPdfData } from '@/server/queries/patient-intakes';
import { createAuditLog } from '@/lib/audit';

export async function getIntakeForPdf(intakeId: string): Promise<IntakeHistoryPdfData | null> {
  const { session, role } = await requireSession({ redirectToLogin: true });
  if (!hasPermission(role, PERMISSIONS.INTAKE_READ)) return null;
  const data = await getIntakeDetailForPdf(intakeId, session.user.id, role);
  if (data) {
    await createAuditLog({
      action: 'record.export',
      targetType: 'patient_intake',
      targetId: intakeId,
      meta: { format: 'pdf' },
      userId: session.user.id,
    });
  }
  return data;
}
