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
  } catch (error) {
    // Lampiran bersifat pelengkap: kegagalan tidak boleh menggagalkan PDF, tetapi
    // tetap terlihat di log agar penyebabnya bisa ditelusuri tanpa data pasien.
    console.error(
      '[record-attachments] gagal memuat lampiran',
      error instanceof Error ? error.message : 'unknown error',
    );
    return [];
  }
}
