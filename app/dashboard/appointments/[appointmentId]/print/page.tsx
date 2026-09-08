import Image from 'next/image';
import { notFound } from 'next/navigation';
import { PrintTrigger } from '@/components/dashboard/print-trigger';
import { PrintFooter } from '@/components/ui/print-footer';
import { getScopedAppointment } from '@/server/queries/appointment-print';

const typeLabel: Record<string, string> = {
  INITIAL_ASSESSMENT: 'Assessment Awal',
  THERAPY_SESSION: 'Sesi Terapi',
  FOLLOW_UP: 'Tindak Lanjut',
  EVALUATION: 'Evaluasi',
};

const statusLabel: Record<string, string> = {
  SCHEDULED: 'Terjadwal',
  CONFIRMED: 'Dikonfirmasi',
  IN_PROGRESS: 'Sedang Berlangsung',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
  NO_SHOW: 'Tidak Hadir',
};

const statusColor: Record<string, string> = {
  SCHEDULED: 'bg-amber-100 text-amber-800 border-amber-300',
  CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-300',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-300',
  COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  CANCELLED: 'bg-red-50 text-red-700 border-red-300',
  NO_SHOW: 'bg-red-100 text-red-800 border-red-300',
};

export default async function PrintAppointmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ appointmentId: string }>;
  searchParams: Promise<{ mode?: 'print' | 'pdf' }>;
}) {
  const { appointmentId } = await params;
  const { mode = 'print' } = await searchParams;
  let appointment;
  try {
    appointment = await getScopedAppointment(appointmentId);
  } catch {
    notFound();
  }

  const date = new Date(appointment.scheduledDate);
  const formattedDate = date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 print:bg-white print:p-0">
      <PrintTrigger mode={mode} patientName={appointment.patientName} recordId={appointment.id} recordedAt={date} backHref="/dashboard/appointments" />
      <div className="mx-auto max-w-3xl min-h-[calc(100vh-8rem)] print:min-h-screen flex flex-col rounded-xl border border-slate-200 bg-white p-8 shadow-sm print:max-w-none print:rounded-none print:border-none print:p-0 print:shadow-none">

        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-amber-300 pb-5">
          <div className="flex items-center gap-4">
            <Image
              src="/images/logos/logos-text.png"
              alt="Hafta Fisioterapi"
              width={140}
              height={60}
              className="h-16 w-auto object-cover"
              priority
            />
            <div>
              <h1 className="text-lg font-bold text-slate-900">HAFTA FISIOTERAPI</h1>
              <p className="text-xs text-slate-500">Klinik & Layanan Terapi Fisik Profesional</p>
              <p className="text-xs text-slate-500">WhatsApp: 0812-3293-2872</p>
            </div>
          </div>
          <div className="text-right">
            <span className="rounded bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200">
              JADWAL APPOINTMENT
            </span>
            <p className="mt-2 font-mono text-xs text-slate-400">ID: {appointment.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>

        {/* Title */}
        <div className="mt-6 text-center">
          <h2 className="text-xl font-bold text-slate-900">Jadwal Appointment</h2>
          <p className="mt-1 text-xs text-slate-500">Dokumen ini merupakan bukti jadwal kunjungan pasien di Hafta Fisioterapi.</p>
        </div>

        {/* Info Grid */}
        <div className="mt-6 rounded-lg bg-slate-50 p-5 print:bg-slate-50">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Detail Appointment</h3>
          <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-slate-500 block">Nama Pasien</span>
              <span className="font-semibold text-slate-900">{appointment.patientName}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Fisioterapis</span>
              <span className="font-semibold text-slate-900">{appointment.therapistName ?? 'Belum ditentukan'}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Tanggal</span>
              <span className="font-semibold text-slate-900">{formattedDate}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Waktu & Durasi</span>
              <span className="font-semibold text-slate-900">
                {appointment.startTime} &bull; {appointment.durationMinutes} menit
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Jenis Kunjungan</span>
              <span className="font-semibold text-slate-900">
                {typeLabel[appointment.type as keyof typeof typeLabel] ?? appointment.type}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Status</span>
              <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusColor[appointment.status as keyof typeof statusColor] ?? 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                {statusLabel[appointment.status as keyof typeof statusLabel] ?? appointment.status}
              </span>
            </div>
          </div>
        </div>

        {/* Catatan */}
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50/50 p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700">Catatan Penting</h3>
          <ul className="mt-2 space-y-1 text-xs text-slate-600">
            <li>&bull; Harap hadir 10 menit sebelum waktu yang dijadwalkan.</li>
            <li>&bull; Bawa kartu identitas dan kartu asuransi (jika ada).</li>
            <li>&bull; Hubungi klinik jika perlu mengubah atau membatalkan jadwal.</li>
          </ul>
        </div>

        {/* Footer — sticky ke bawah */}
        <PrintFooter signerName="Hafta Fisioterapi" />
      </div>
    </div>
  );
}
