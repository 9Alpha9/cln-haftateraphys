import { and, asc, eq, like } from 'drizzle-orm';
import { getDb } from '@/db';
import { patientDocuments } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { getTherapyProgressById } from '@/server/queries/therapy-progress';
import { getObject, isR2Configured } from '@/lib/storage/r2';
import { DOCUMENT_TYPE_LABELS } from '@/lib/documents';

export type RecordAttachmentImage = {
  id: string;
  name: string;
  caption: string;
  dataUrl: string;
};

const MAX_ATTACHMENTS = 4;
const MAX_TOTAL_BYTES = 9 * 1024 * 1024;

/**
 * Lampiran foto analisa/hasil pemeriksaan yang diunggah terapis melalui menu
 * Dokumen (jenis: Hasil Pemeriksaan). Hanya gambar aktif yang dimasukkan ke PDF.
 */
export async function getRecordAttachmentImages(recordId: string): Promise<RecordAttachmentImage[]> {
  if (!isR2Configured()) return [];

  const { role } = await requireSession({ redirectToLogin: false });
  const record = await getTherapyProgressById(recordId);
  if (!record) return [];

  const rows = await getDb()
    .select({
      id: patientDocuments.id,
      originalFilename: patientDocuments.originalFilename,
      mimeType: patientDocuments.mimeType,
      sizeBytes: patientDocuments.sizeBytes,
      documentType: patientDocuments.documentType,
      createdAt: patientDocuments.createdAt,
      storageKey: patientDocuments.storageKey,
    })
    .from(patientDocuments)
    .where(
      and(
        eq(patientDocuments.patientId, record.patientId),
        eq(patientDocuments.status, 'ACTIVE'),
        eq(patientDocuments.documentType, 'EXAM_RESULT'),
        like(patientDocuments.mimeType, 'image/%'),
        role === 'USER' ? eq(patientDocuments.patientVisible, 1) : undefined,
      ),
    )
    .orderBy(asc(patientDocuments.createdAt))
    .limit(MAX_ATTACHMENTS);

  const images: RecordAttachmentImage[] = [];
  let totalBytes = 0;

  for (const row of rows) {
    if (!row.storageKey || totalBytes + row.sizeBytes > MAX_TOTAL_BYTES) continue;
    try {
      const object = await getObject(row.storageKey);
      const buffer = Buffer.from(await object.arrayBuffer());
      totalBytes += buffer.byteLength;
      const typeLabel = DOCUMENT_TYPE_LABELS[row.documentType] ?? 'Hasil Pemeriksaan';
      const date = new Date(row.createdAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      images.push({
        id: row.id,
        name: row.originalFilename ?? 'Lampiran pemeriksaan',
        caption: `${typeLabel} — ${row.originalFilename ?? 'Lampiran'} · diunggah ${date}`,
        dataUrl: `data:${row.mimeType};base64,${buffer.toString('base64')}`,
      });
    } catch {
      // Lampiran yang gagal diambil tidak boleh menggagalkan pembuatan PDF.
    }
  }

  return images;
}
