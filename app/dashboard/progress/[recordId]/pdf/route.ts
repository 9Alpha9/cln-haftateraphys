import { NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/audit';
import { requireSession, UnauthenticatedError } from '@/lib/auth/require-session';
import { ForbiddenError, hasPermission, PERMISSIONS } from '@/lib/permissions';
import { medicalRecordFileName } from '@/components/pdf/medical-record-filename';
import { buildMedicalRecordPdfSource } from '@/server/queries/medical-record-pdf';
import { renderMedicalRecordPdfBuffer } from '@/server/pdf/render-medical-record-pdf';

export const dynamic = 'force-dynamic';
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

    const buffer = await renderMedicalRecordPdfBuffer(source.pdfRecord);
    const filename = medicalRecordFileName(source.pdfRecord);
    const asciiFilename = filename.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_');

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': String(buffer.byteLength),
        'Content-Disposition': `inline; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Cache-Control': 'no-store, max-age=0',
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
