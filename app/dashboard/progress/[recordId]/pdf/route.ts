import { NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/audit';
import { requireSession, UnauthenticatedError } from '@/lib/auth/require-session';
import { ForbiddenError, hasPermission, PERMISSIONS } from '@/lib/permissions';
import { medicalRecordFileName } from '@/components/pdf/medical-record-filename';
import { buildMedicalRecordPdfSource } from '@/server/queries/medical-record-pdf';
import { renderMedicalRecordPdfBuffer } from '@/server/pdf/render-medical-record-pdf';

export const dynamic = 'force-dynamic';

/**
 * Cache hasil render di memori proses.
 *
 * Render PDF (layout + sematan gambar) memakan ~1–3 detik. Membuka pratinjau
 * berulang untuk rekam yang sama tidak perlu mengulang pekerjaan itu. Kunci
 * memuat `updatedAt` rekam sehingga suntingan/amandemen otomatis
 * menghasilkan render baru.
 */
const PDF_CACHE_TTL_MS = 60_000;
const PDF_CACHE_MAX_ENTRIES = 16;
const pdfCache = new Map<string, { buffer: Buffer; expiresAt: number }>();

function readCachedPdf(key: string): Buffer | null {
  const entry = pdfCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    pdfCache.delete(key);
    return null;
  }
  return entry.buffer;
}

function writeCachedPdf(key: string, buffer: Buffer): void {
  if (pdfCache.size >= PDF_CACHE_MAX_ENTRIES) {
    const oldestKey = pdfCache.keys().next().value;
    if (oldestKey) pdfCache.delete(oldestKey);
  }
  pdfCache.set(key, { buffer, expiresAt: Date.now() + PDF_CACHE_TTL_MS });
}
export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * Endpoint PDF rekam medis.
 *
 * Viewer PDF browser memakai `Content-Disposition` sebagai nama unduhan, sehingga
 * berkas tersimpan sebagai `<Nama Pasien>-<No. RM>-<Tanggal>.pdf` — bukan UUID
 * blob seperti saat PDF dirender di sisi klien.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ recordId: string }> },
) {
  try {
    const { recordId } = await context.params;
    const { session, role } = await requireSession({ redirectToLogin: false });
    if (role !== 'USER' && !hasPermission(role, PERMISSIONS.PATIENT_EXPORT)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const source = await buildMedicalRecordPdfSource(recordId);
    if (!source) return new NextResponse('Rekam medis tidak ditemukan.', { status: 404 });

    await createAuditLog({
      action: 'therapy_progress.export',
      targetType: 'therapy_progress',
      targetId: source.record.id,
      meta: { mode: 'pdf' },
      userId: session.user.id,
    });

    const cacheKey = `${source.record.id}:${new Date(source.record.updatedAt).getTime()}:${source.pdfRecord.attachmentImages?.length ?? 0}`;
    const cached = readCachedPdf(cacheKey);
    const buffer = cached ?? (await renderMedicalRecordPdfBuffer(source.pdfRecord));
    if (!cached) writeCachedPdf(cacheKey, buffer);
    const filename = medicalRecordFileName(source.pdfRecord);
    const asciiFilename = filename.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_');

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': String(buffer.byteLength),
        'Content-Disposition': `inline; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Cache-Control': 'no-store, max-age=0',
        'X-Pdf-Cache': cached ? 'hit' : 'miss',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return new NextResponse('Forbidden', { status: 403 });
    }
    return new NextResponse('Dokumen tidak dapat dibuat.', { status: 500 });
  }
}
