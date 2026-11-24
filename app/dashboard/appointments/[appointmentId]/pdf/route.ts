import { NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/audit';
import { requireSession, UnauthenticatedError } from '@/lib/auth/require-session';
import { ForbiddenError, hasPermission, PERMISSIONS } from '@/lib/permissions';
import { buildAppointmentPdfBuffer } from '@/server/pdf/render-appointment-pdf';
import { appointmentPdfFileName } from '@/components/pdf/appointment-pdf-filename';
import { getScopedAppointment } from '@/server/queries/appointment-print';

export const dynamic = 'force-dynamic';

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
 * Endpoint PDF jadwal kunjungan.
 *
 * Render dokumen PDF jadwal appointment melalui @react-pdf/renderer di server,
 * disajikan dengan `Content-Disposition` untuk nama file unduhan yang rapi,
 * dan dilindungi sesi/otorisasi.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ appointmentId: string }> },
) {
  try {
    const { appointmentId } = await context.params;
    const { session, role } = await requireSession({ redirectToLogin: false });

    if (!hasPermission(role, PERMISSIONS.APPOINTMENT_READ)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const appointment = await getScopedAppointment(appointmentId);

    await createAuditLog({
      action: 'appointment.export',
      targetType: 'appointment',
      targetId: appointment.id,
      meta: { mode: 'pdf' },
      userId: session.user.id,
    });

    const record: import('@/components/pdf/appointment-document').AppointmentPdfData = {
      id: appointment.id,
      patientName: appointment.patientName,
      medicalRecordNumber: appointment.medicalRecordNumber ?? null,
      dateOfBirth: appointment.dateOfBirth ?? null,
      gender: appointment.gender ?? null,
      phone: appointment.phone ?? null,
      addressLine: appointment.addressLine ?? null,
      addressCity: appointment.addressCity ?? null,
      therapistName: appointment.therapistName ?? null,
      scheduledDate: appointment.scheduledDate,
      startTime: appointment.startTime,
      durationMinutes: appointment.durationMinutes,
      status: appointment.status,
      administrativeNote: appointment.administrativeNote ?? null,
    };

    const buffer = await buildAppointmentPdfBuffer(record);

    const filename = appointmentPdfFileName(record);
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