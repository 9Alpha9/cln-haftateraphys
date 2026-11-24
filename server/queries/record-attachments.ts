import { and, asc, desc, eq, inArray, isNull } from 'drizzle-orm';
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
 * Format gambar yang dapat disematkan `@react-pdf/renderer`. WebP/HEIC/SVG tidak
 * didukung dan akan tampil sebagai kotak kosong pada PDF, sehingga tidak diambil.
 */
const PDF_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg'];

/**
 * Lampiran foto analisa/hasil pemeriksaan milik satu rekam medis.
 *
 * Hanya gambar yang diunggah dari form rekam medis (terikat lewat
 * `therapy_progress_record_id`) yang diambil, sehingga lampiran tidak bocor ke
 * rekam lain milik pasien yang sama.
 */
export async function getRecordAttachmentImages(
  recordId: string,
  /** Rekam yang sudah dimuat pemanggil, untuk menghindari query ganda. */
  preloadedRecord?: { id: string; patientId: string },
): Promise<RecordAttachmentImage[]> {
  if (!isR2Configured()) return [];

  const { role } = await requireSession({ redirectToLogin: false });
  const record = preloadedRecord ?? (await getTherapyProgressById(recordId));
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
        eq(patientDocuments.therapyProgressRecordId, record.id),
        eq(patientDocuments.patientId, record.patientId),
        eq(patientDocuments.status, 'ACTIVE'),
        // Jenis dokumen tidak dibatasi: foto dari menu Dokumen (jenis "Lainnya")
        // tetap boleh dilampirkan selama formatnya bisa disematkan ke PDF.
        inArray(patientDocuments.mimeType, PDF_IMAGE_MIME_TYPES),
        role === 'USER' ? eq(patientDocuments.patientVisible, 1) : undefined,
      ),
    )
    // Ambil satu baris berlebih: bila cap lampiran tercapai, pemanggil tetap
    // dapat memastikan file tertentu sudah terikat (lihat isFileLinkedToRecord).
    .orderBy(asc(patientDocuments.createdAt))
    .limit(MAX_ATTACHMENTS + 1);

  // Hitung kuota byte lebih dulu (data ukuran sudah ada di DB), lalu ambil semua
  // objek secara paralel agar tidak menunggu satu per satu.
  let totalBytes = 0;
  const selected = rows.filter((row) => {
    if (!row.storageKey) return false;
    if (totalBytes + row.sizeBytes > MAX_TOTAL_BYTES) return false;
    totalBytes += row.sizeBytes;
    return true;
  });

  const images = await Promise.all(
    selected.map(async (row): Promise<RecordAttachmentImage | null> => {
      try {
        const object = await getObject(row.storageKey as string);
        const buffer = Buffer.from(await object.arrayBuffer());
        const typeLabel = DOCUMENT_TYPE_LABELS[row.documentType] ?? 'Hasil Pemeriksaan';
        const date = new Date(row.createdAt).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
        return {
          id: row.id,
          name: row.originalFilename ?? 'Lampiran pemeriksaan',
          caption: `${typeLabel} — ${row.originalFilename ?? 'Lampiran'} · diunggah ${date}`,
          dataUrl: `data:${row.mimeType};base64,${buffer.toString('base64')}`,
        };
      } catch {
        // Lampiran yang gagal diambil tidak boleh menggagalkan pembuatan PDF.
        return null;
      }
    }),
  );

  return images.filter((image): image is RecordAttachmentImage => image !== null);
}


export type UnlinkedDocumentImage = {
  id: string;
  name: string;
  mimeType: string;
  createdAt: Date;
};

/**
 * Gambar milik pasien yang belum terhubung ke rekam medis mana pun. Ditampilkan
 * pada form rekam agar terapis bisa melampirkan foto lama tanpa mengunggah ulang.
 * Semua jenis dokumen diterima selama formatnya PNG/JPEG.
 */
export async function listUnlinkedImages(patientId: string): Promise<UnlinkedDocumentImage[]> {
  if (!isR2Configured()) return [];

  await requireSession({ redirectToLogin: false });

  const rows = await getDb()
    .select({
      id: patientDocuments.id,
      name: patientDocuments.originalFilename,
      mimeType: patientDocuments.mimeType,
      createdAt: patientDocuments.createdAt,
    })
    .from(patientDocuments)
    .where(
      and(
        eq(patientDocuments.patientId, patientId),
        eq(patientDocuments.status, 'ACTIVE'),
        // WebP ikut ditampilkan: saat dilampirkan, browser mengonversinya ke PNG
        // lebih dulu karena @react-pdf tidak dapat menyematkan WebP.
        inArray(patientDocuments.mimeType, [...PDF_IMAGE_MIME_TYPES, 'image/webp']),
        isNull(patientDocuments.therapyProgressRecordId),
      ),
    )
    // Satu baris berlebih supaya "sudah terlampir" tetap terbaca saat cap 12 terisi.
    .orderBy(desc(patientDocuments.createdAt))
    .limit(13);

  return rows.map((row) => ({
    id: row.id,
    name: row.name ?? 'Lampiran pemeriksaan',
    mimeType: row.mimeType,
    createdAt: row.createdAt,
  }));
}


export type RecordAttachmentMeta = { id: string; name: string };

/**
 * Apakah sebuah dokumen sudah terikat ke rekam medis (`therapy_progress_record_id`
 * terisi)? Dipakai untuk menyembunyikan foto yang sudah dilampirkan dari daftar
 * "belum terhubung" tanpa harus mengunduh isi berkasnya.
 */
export async function isFileLinkedToRecord(documentId: string): Promise<boolean> {
  const [row] = await getDb()
    .select({ recordId: patientDocuments.therapyProgressRecordId })
    .from(patientDocuments)
    .where(eq(patientDocuments.id, documentId))
    .limit(1);
  return Boolean(row?.recordId);
}

/**
 * Metadata lampiran rekam (tanpa mengunduh isi gambar dari storage). Dipakai
 * form rekam agar daftar lampiran tampil cepat; isi gambar hanya diambil saat
 * PDF benar-benar dirender.
 */
export async function listRecordAttachmentMeta(
  recordId: string,
  preloadedRecord?: { id: string; patientId: string },
): Promise<RecordAttachmentMeta[]> {
  const { role } = await requireSession({ redirectToLogin: false });
  const record = preloadedRecord ?? (await getTherapyProgressById(recordId));
  if (!record) return [];

  const rows = await getDb()
    .select({ id: patientDocuments.id, name: patientDocuments.originalFilename })
    .from(patientDocuments)
    .where(
      and(
        eq(patientDocuments.therapyProgressRecordId, record.id),
        eq(patientDocuments.patientId, record.patientId),
        eq(patientDocuments.status, 'ACTIVE'),
        inArray(patientDocuments.mimeType, PDF_IMAGE_MIME_TYPES),
        role === 'USER' ? eq(patientDocuments.patientVisible, 1) : undefined,
      ),
    )
    .orderBy(asc(patientDocuments.createdAt))
    .limit(MAX_ATTACHMENTS);

  return rows.map((row) => ({ id: row.id, name: row.name ?? 'Lampiran pemeriksaan' }));
}
