'use server';

import { createAuditLog } from '@/lib/audit';
import { getRecordAttachmentImages, type RecordAttachmentImage } from '@/server/queries/record-attachments';

export async function fetchRecordAttachmentImages(
  recordId: string,
): Promise<RecordAttachmentImage[]> {
  try {
    const images = await getRecordAttachmentImages(recordId);
    if (images.length > 0) {
      await createAuditLog({
        action: 'therapy_progress.attachment.export',
        targetType: 'therapy_progress',
        targetId: recordId,
        meta: { count: images.length },
      });
    }
    return images;
  } catch {
    return [];
  }
}
