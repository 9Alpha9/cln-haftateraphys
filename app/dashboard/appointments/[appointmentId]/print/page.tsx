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
 *
 * Shell sengaja identik dengan `MedicalRecordPrintClient`: viewer langsung di
 * dalam satu kartu tanpa header/toolbar tambahan, supaya tidak pernah muncul
 * pratinjau di dalam pratinjau.
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
    <div className="flex min-h-dvh flex-col bg-stone-100 print:block print:bg-white">
      <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-3 py-3 sm:px-5 sm:py-5 print:block print:p-0">
        <div className="flex min-h-[70vh] flex-1 flex-col overflow-hidden rounded-xl border border-stone-200 bg-white">
          <AppointmentPrintPreview appointmentId={appointment.id} />
        </div>
      </div>
    </div>
  );
}
