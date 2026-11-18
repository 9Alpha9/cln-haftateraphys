'use server';

import { randomUUID } from 'crypto';
import { and, eq, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/db';
import { patientAssignments, patientDocuments, patients, therapyProgressRecords } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { createAuditLog } from '@/lib/audit';
import { ForbiddenError, hasPermission, PERMISSIONS } from '@/lib/permissions';
import { isR2Configured, uploadObject } from '@/lib/storage/r2';
import { DOCUMENT_TYPES, isAllowedDocumentMime, MAX_DOCUMENT_BYTES } from '@/lib/documents';

export type DocumentActionResult =
  | { ok: true; documentId?: string }
  | { ok: false; error: string };

const MIME_EXTENSION: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function sanitizeFilename(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, '_').slice(0, 200);
}

export async function uploadDocument(formData: FormData): Promise<DocumentActionResult> {
  const { session, role } = await requireSession({ redirectToLogin: false });
  if (!hasPermission(role, PERMISSIONS.DOCUMENT_UPLOAD)) {
    return { ok: false, error: 'Anda tidak memiliki izin mengunggah dokumen.' };
  }
  if (!isR2Configured()) {
    return { ok: false, error: 'Penyimpanan dokumen (R2) belum dikonfigurasi.' };
  }

  const patientId = String(formData.get('patientId') ?? '').trim();
  const documentType = String(formData.get('documentType') ?? 'OTHER').trim();
  const recordIdRaw = String(formData.get('recordId') ?? '').trim();
  const patientVisible = formData.get('patientVisible') === 'on' ? 1 : 0;
  const file = formData.get('file');

  if (!patientId) return { ok: false, error: 'Pasien wajib dipilih.' };
  if (!DOCUMENT_TYPES.includes(documentType)) {
    return { ok: false, error: 'Jenis dokumen tidak valid.' };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'File dokumen wajib dipilih.' };
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    return { ok: false, error: 'Ukuran file maksimal 10 MB.' };
  }
  if (!isAllowedDocumentMime(file.type)) {
    return { ok: false, error: 'Format file harus PDF, JPG, PNG, atau WEBP.' };
  }

  const db = getDb();
  const [patient] = await db
    .select({ id: patients.id })
    .from(patients)
    .where(eq(patients.id, patientId))
    .limit(1);
  if (!patient) return { ok: false, error: 'Pasien tidak ditemukan.' };

  // Lampiran rekam medis: rekam harus ada dan milik pasien yang sama.
  let recordId: string | null = null;
  if (recordIdRaw) {
    const [record] = await db
      .select({ id: therapyProgressRecords.id, patientId: therapyProgressRecords.patientId })
      .from(therapyProgressRecords)
      .where(eq(therapyProgressRecords.id, recordIdRaw))
      .limit(1);
    if (!record || record.patientId !== patientId) {
      return { ok: false, error: 'Rekam medis lampiran tidak ditemukan untuk pasien ini.' };
    }
    recordId = record.id;
  }

  if (role === 'THERAPIST') {
    const [assignment] = await db
      .select({ id: patientAssignments.id })
      .from(patientAssignments)
      .where(
        and(
          eq(patientAssignments.patientId, patientId),
          eq(patientAssignments.staffUserId, session.user.id),
          isNull(patientAssignments.activeUntil),
        ),
      )
      .limit(1);
    if (!assignment) {
      return { ok: false, error: 'Anda hanya dapat mengunggah dokumen untuk pasien yang di-assign.' };
    }
  }

  const extension = MIME_EXTENSION[file.type] ?? 'bin';
  const storageKey = `patients/${patientId}/${randomUUID()}.${extension}`;
  const buffer = await file.arrayBuffer();

  try {
    await uploadObject({ key: storageKey, body: buffer, contentType: file.type });
  } catch {
    return { ok: false, error: 'Dokumen gagal diunggah ke penyimpanan.' };
  }

  let documentId: string;
  try {
    const [created] = await db
      .insert(patientDocuments)
      .values({
        patientId,
        uploadedBy: session.user.id,
        storageKey,
        originalFilename: sanitizeFilename(file.name || `dokumen.${extension}`),
        mimeType: file.type,
        sizeBytes: file.size,
        documentType: documentType as never,
        therapyProgressRecordId: recordId,
        patientVisible,
        status: 'ACTIVE',
      })
      .returning({ id: patientDocuments.id });
    documentId = created.id;
  } catch {
    return { ok: false, error: 'Dokumen gagal disimpan. Silakan coba lagi.' };
  }

  await createAuditLog({
    action: 'document.upload',
    targetType: 'document',
    targetId: patientId,
    meta: { documentType, sizeBytes: file.size, patientVisible, recordId },
    userId: session.user.id,
  });

  revalidatePath('/dashboard/documents');
  return { ok: true, documentId };
}

export async function archiveDocument(documentId: string): Promise<DocumentActionResult> {
  const { session, role } = await requireSession({ redirectToLogin: false });
  if (!hasPermission(role, PERMISSIONS.DOCUMENT_ARCHIVE)) {
    throw new ForbiddenError();
  }

  const db = getDb();
  const [document] = await db
    .select({ id: patientDocuments.id, patientId: patientDocuments.patientId })
    .from(patientDocuments)
    .where(eq(patientDocuments.id, documentId))
    .limit(1);

  if (!document) return { ok: false, error: 'Dokumen tidak ditemukan.' };

  await db
    .update(patientDocuments)
    .set({ status: 'ARCHIVED', updatedAt: new Date() })
    .where(eq(patientDocuments.id, documentId));

  await createAuditLog({
    action: 'document.archive',
    targetType: 'document',
    targetId: documentId,
    meta: { patientId: document.patientId },
    userId: session.user.id,
  });

  revalidatePath('/dashboard/documents');
  return { ok: true };
}

/**
 * Soft-archive a document that the current user uploaded (or any document for
 * users with archive permission). Used by the medical-record photo uploader so
 * a freshly uploaded photo can be removed again without hard-deleting clinical
 * data.
 */
export async function removeOwnDocument(documentId: string): Promise<DocumentActionResult> {
  const { session, role } = await requireSession({ redirectToLogin: false });
  const canArchive = hasPermission(role, PERMISSIONS.DOCUMENT_ARCHIVE);
  if (!canArchive && !hasPermission(role, PERMISSIONS.DOCUMENT_UPLOAD)) {
    return { ok: false, error: 'Anda tidak memiliki izin menghapus dokumen.' };
  }

  const db = getDb();
  const [document] = await db
    .select({
      id: patientDocuments.id,
      patientId: patientDocuments.patientId,
      uploadedBy: patientDocuments.uploadedBy,
      status: patientDocuments.status,
    })
    .from(patientDocuments)
    .where(eq(patientDocuments.id, documentId))
    .limit(1);

  if (!document) return { ok: false, error: 'Dokumen tidak ditemukan.' };
  if (document.status === 'ARCHIVED') return { ok: true };

  if (!canArchive && document.uploadedBy !== session.user.id) {
    return { ok: false, error: 'Anda hanya dapat menghapus dokumen yang Anda unggah.' };
  }

  if (role === 'THERAPIST') {
    const [assignment] = await db
      .select({ id: patientAssignments.id })
      .from(patientAssignments)
      .where(
        and(
          eq(patientAssignments.patientId, document.patientId),
          eq(patientAssignments.staffUserId, session.user.id),
          isNull(patientAssignments.activeUntil),
        ),
      )
      .limit(1);
    if (!assignment) {
      return { ok: false, error: 'Anda hanya dapat menghapus dokumen untuk pasien yang di-assign.' };
    }
  }

  await db
    .update(patientDocuments)
    .set({ status: 'ARCHIVED', updatedAt: new Date() })
    .where(eq(patientDocuments.id, documentId));

  await createAuditLog({
    action: 'document.archive',
    targetType: 'document',
    targetId: documentId,
    meta: { patientId: document.patientId, reason: 'uploader-delete' },
    userId: session.user.id,
  });

  revalidatePath('/dashboard/documents');
  revalidatePath('/dashboard/progress');
  return { ok: true };
}
