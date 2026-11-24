import { notFound } from 'next/navigation';
import { getScopedAppointment } from '@/server/queries/appointment-print';
import { requireSession } from '@/lib/auth/require-session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';
import { AppointmentPrintPreview } from '@/components/pdf/appointment-print-preview';

/**
 * Halaman pratinjau cetak jadwal kunjungan.
 *
 * Dokumen dirender oleh `@react-pdf/renderer` di endpoint
 * `/dashboard/appointments/[appointmentId]/pdf`, lalu ditampilkan dengan PDF.js
 * Generic Viewer resmi — sehingga navigasi halaman, zoom, pencarian, sidebar,
 * cetak, dan unduh memakai kontrol bawaan PDF.js, bukan toolbar buatan aplikasi.
 */
export default async function PrintAppointmentPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = await params;
  const { session, role } = await requireSession({ redirectToLogin: true });
  if (role !== 'USER' && !hasPermission(role, PERMISSIONS.PATIENT_EXPORT)) notFound();

  let appointment;
  try {
    appointment = await getScopedAppointment(appointmentId);
  } catch {
    notFound();
  }

  await createAuditLog({
    action: 'appointment.export',
    targetType: 'appointment',
    targetId: appointment.id,
    meta: { mode: 'pdf' },
    userId: session.user.id,
  });

  return (
    <div className="min-h-screen bg-stone-50 p-4 sm:p-8">
      <div className="mx-auto flex h-[calc(100dvh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-background sm:h-[calc(100dvh-4rem)]">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">Pratinjau Cetak Jadwal</p>
            <p className="truncate text-[10.5px] text-muted-foreground">
              {appointment.patientName} · Gunakan toolbar PDF untuk mencari, memperbesar, mencetak,
              atau mengunduh.
            </p>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden bg-white">
          <AppointmentPrintPreview appointmentId={appointment.id} />
        </div>
      </div>
    </div>
  );
}
