'use server';

import { requireSession } from '@/lib/auth/require-session';
import { createAuditLog } from '@/lib/audit';
import { getTherapyProgressById } from '@/server/queries/therapy-progress';

export type RecordExportResult = { ok: boolean };

/**
 * Records a clinical-record export (print/PDF) after verifying that the current
 * user can read the record. This is intentionally an audit hook, not a second
 * authorization layer: getTherapyProgressById already enforces scope/visibility.
 */
export async function recordClinicalRecordExport(
  recordId: string,
  format: 'print' | 'pdf',
): Promise<RecordExportResult> {
  try {
    const { session } = await requireSession({ redirectToLogin: false });
    const record = await getTherapyProgressById(recordId);
    if (!record) return { ok: false };

    await createAuditLog({
      action: 'record.export',
      targetType: 'therapy_progress_record',
      targetId: recordId,
      meta: { format, patientId: record.patientId, revisionNumber: record.revisionNumber ?? 1 },
      userId: session.user.id,
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
