'use server';

import { and, eq, isNull } from 'drizzle-orm';
import { createAuditLog } from '@/lib/audit';
import { getDb } from '@/db';
import { patientAssignments, patientDocuments, therapyProgressRecords } from '@/db/schema';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { requireSession } from '@/lib/auth/require-session';
import {
  getRecordAttachmentImages,
  listRecordAttachmentMeta,
  listUnlinkedImages,
  type RecordAttachmentImage,
  type UnlinkedDocumentImage,
} from '@/server/queries/record-attachments';

/** Melampirkan foto pasien yang sudah diunggah ke rekam medis tertentu. */
export async function attachDocumentToRecord(
  documentId: string,
  recordId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { role, session } = await requireSession({ redirectToLogin: false });
    if (!hasPermission(role, PERMISSIONS.DOCUMENT_UPLOAD)) {
      return { ok: false, error: 'Anda tidak memiliki izin melampirkan dokumen.' };
    }

    const db = getDb();
    const [record] = await db
      .select({ id: therapyProgressRecords.id, patientId: therapyProgressRecords.patientId })
      .from(therapyProgressRecords)
      .where(eq(therapyProgressRecords.id, recordId))
      .limit(1);
    if (!record) return { ok: false, error: 'Rekam medis tidak ditemukan.' };

    const [document] = await db
      .select({
        id: patientDocuments.id,
        patientId: patientDocuments.patientId,
        recordId: patientDocuments.therapyProgressRecordId,
      })
      .from(patientDocuments)
      .where(eq(patientDocuments.id, documentId))
      .limit(1);
    if (!document) return { ok: false, error: 'Dokumen tidak ditemukan.' };
    if (document.patientId !== record.patientId) {
      return { ok: false, error: 'Dokumen bukan milik pasien pada rekam ini.' };
    }
    if (document.recordId && document.recordId !== recordId) {
      return { ok: false, error: 'Dokumen sudah dilampirkan pada rekam lain.' };
    }

    if (role === 'THERAPIST') {
      const [assignment] = await db
        .select({ id: patientAssignments.id })
        .from(patientAssignments)
        .where(
          and(
            eq(patientAssignments.patientId, record.patientId),
            eq(patientAssignments.staffUserId, session.user.id),
            isNull(patientAssignments.activeUntil),
          ),
        )
        .limit(1);
      if (!assignment) {
        return { ok: false, error: 'Anda hanya dapat mengubah pasien yang di-assign.' };
      }
    }

    await db
      .update(patientDocuments)
      .set({ therapyProgressRecordId: recordId, updatedAt: new Date() })
      .where(eq(patientDocuments.id, documentId));

    await createAuditLog({
      action: 'therapy_progress.attachment.attach',
      targetType: 'therapy_progress',
      targetId: recordId,
      meta: { documentId },
      userId: session.user.id,
    });

    return { ok: true };
  } catch {
    return { ok: false, error: 'Foto gagal dilampirkan. Coba lagi.' };
  }
}

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


export async function fetchUnlinkedImages(patientId: string): Promise<UnlinkedDocumentImage[]> {
  try {
    return await listUnlinkedImages(patientId);
  } catch {
    return [];
  }
}


export async function fetchRecordAttachmentMeta(recordId: string) {
  try {
    return await listRecordAttachmentMeta(recordId);
  } catch {
    return [];
  }
}
