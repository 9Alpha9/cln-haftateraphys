import { notFound } from 'next/navigation';
import { PrintButton } from '@/components/ui/print-button';
import { getScopedAppointment } from '@/server/queries/appointment-print';

const typeLabel = {
  INITIAL_ASSESSMENT: 'Assessment Awal',
  THERAPY_SESSION: 'Sesi Terapi',
  FOLLOW_UP: 'Tindak Lanjut',
  EVALUATION: 'Evaluasi',
} as const;

export default async function PrintAppointmentPage({ params }: { params: Promise<{ appointmentId: string }> }) {
  const { appointmentId } = await params;
  let appointment;
  try {
    appointment = await getScopedAppointment(appointmentId);
  } catch {
    notFound();
  }
  const date = new Date(appointment.scheduledDate).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return (
    <main className="min-h-screen bg-white p-4 sm:p-8 print:min-h-0 print:p-0">
      <div className="mx-auto max-w-2xl space-y-6 print:max-w-none">
        <div className="flex items-start justify-between print:hidden">
          <div>
            <p className="text-sm font-semibold text-primary">Hafta Fisioterapi</p>
            <h1 className="mt-1 text-2xl font-bold text-foreground">Cetak Jadwal</h1>
          </div>
          <PrintButton label="Cetak / Simpan PDF" />
        </div>
        <section className="rounded-xl border border-border bg-white p-6 print:border-0 print:p-0">
          <div className="border-b border-border pb-5">
            <p className="text-sm font-semibold text-primary">Hafta Fisioterapi</p>
            <h1 className="mt-1 text-2xl font-bold text-foreground">Jadwal Appointment</h1>
          </div>
          <dl className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">Pasien</dt>
              <dd className="mt-1 font-semibold text-foreground">{appointment.patientName}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Terapis</dt>
              <dd className="mt-1 font-semibold text-foreground">{appointment.therapistName ?? 'Belum ditentukan'}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Tanggal</dt>
              <dd className="mt-1 font-semibold text-foreground">{date}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Waktu</dt>
              <dd className="mt-1 font-semibold text-foreground">
                {appointment.startTime} · {appointment.durationMinutes} menit
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Jenis</dt>
              <dd className="mt-1 font-semibold text-foreground">
                {typeLabel[appointment.type as keyof typeof typeLabel]}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Status</dt>
              <dd className="mt-1 font-semibold text-foreground">{appointment.status}</dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
}
