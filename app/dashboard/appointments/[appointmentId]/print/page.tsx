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
  CONFIRMED: 'Terkonfirmasi',
  IN_PROGRESS: 'Sedang berjalan',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
  NO_SHOW: 'Tidak hadir',
};

const statusColor: Record<string, string> = {
  SCHEDULED: 'bg-white text-stone-800 border-stone-400',
  CONFIRMED: 'bg-white text-stone-800 border-stone-400',
  IN_PROGRESS: 'bg-white text-stone-800 border-stone-400',
  COMPLETED: 'bg-white text-stone-800 border-stone-400',
  CANCELLED: 'bg-white text-stone-800 border-stone-400',
  NO_SHOW: 'bg-white text-stone-800 border-stone-400',
};

function calculateAge(dob: Date | string | null | undefined): string {
  if (!dob) return '-';
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return '-';
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return `${age} tahun`;
}

function formatGender(gender: string | null | undefined): string {
  if (gender === 'MALE') return 'Laki-laki';
  if (gender === 'FEMALE') return 'Perempuan';
  if (gender === 'OTHER') return 'Lainnya';
  return gender || '-';
}

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
  const dobFormatted = appointment.dateOfBirth
    ? new Date(appointment.dateOfBirth).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;
  const patientAddress =
    [appointment.addressLine, appointment.addressCity].filter(Boolean).join(', ') || '-';

  return (
    <div className="min-h-screen bg-stone-50 p-4 sm:p-8 print:bg-white print:p-0">
      <PrintTrigger
        mode={mode}
        patientName={appointment.patientName}
        recordId={appointment.id}
        recordedAt={date}
        medicalRecordNumber={appointment.medicalRecordNumber}
        backHref="/dashboard/appointments"
      />
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-3xl flex-col border border-stone-200/70 bg-white p-6 shadow-[0_8px_30px_rgba(24,23,0,0.05)] print:max-w-none print:min-h-screen print:print:border-none print:p-0 print:shadow-none sm:p-8">
        {/* Kop Dokumen */}
        <div className="flex flex-col gap-4 border-b border-stone-200/80 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3.5">
            <Image
              src="/images/logos/logos-text.png"
              alt="Hafta Fisioterapi"
              width={140}
              height={60}
              className="self-start h-14 w-auto shrink-0 object-contain object-left-top"
              priority
            />
            <div className="min-w-0">
              <h1 className="text-xl font-bold leading-tight text-[#181700]">HAFTA FISIOTERAPI</h1>
              <p className="mt-0.5 text-xs font-medium text-stone-500">
                Klinik &amp; Layanan Terapi Fisik Profesional
              </p>
              <p className="mt-1 max-w-md text-[11px] leading-relaxed text-stone-500">
                Jl. Pd. Sidokare Indah No.AE-13, Sidokare, Sidoarjo 61214
                <br />
                WhatsApp: 0812-3293-2872
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-1.5 sm:items-end">
            <span className="inline-flex whitespace-nowrap border border-stone-300 bg-white px-3 py-1 text-[10px] font-bold text-[#181700]">
              JADWAL APPOINTMENT
            </span>
            <p className="font-mono text-[10px] text-stone-400">
              ID: {appointment.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
        </div>

        {/* Judul */}
        <div className="mt-6 text-center">
          <h2 className="text-xl font-bold text-[#181700]">Bukti Jadwal Kunjungan</h2>
          <p className="mx-auto mt-1 max-w-lg text-xs leading-relaxed text-stone-500">
            Dokumen ini merupakan bukti jadwal kunjungan pasien di Hafta Fisioterapi.
          </p>
        </div>

        {/* Ringkasan Jadwal */}
        <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div className="border border-stone-200/70 bg-stone-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">Tanggal</p>
            <p className="mt-1 text-sm font-bold text-[#181700]">{formattedDate}</p>
          </div>
          <div className="border border-stone-300 bg-stone-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-stone-500">Waktu</p>
            <p className="mt-1 text-sm font-bold text-[#181700]">
              {appointment.startTime} &bull; {appointment.durationMinutes} menit WIB
            </p>
          </div>
        </div>

        {/* Data Pasien */}
        <section className="mt-4 border border-stone-200/70 bg-white p-4 print:break-inside-avoid sm:p-5">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">Data Pasien</h3>
          <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[10px] font-medium text-stone-500">Nama Pasien</dt>
              <dd className="mt-0.5 font-bold text-[#181700]">{appointment.patientName}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-medium text-stone-500">No. Rekam Medis</dt>
              <dd className="mt-0.5 font-mono font-bold text-[#181700]">{appointment.medicalRecordNumber || '-'}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-medium text-stone-500">Umur / Tanggal Lahir</dt>
              <dd className="mt-0.5 text-stone-800">
                {calculateAge(appointment.dateOfBirth)} {dobFormatted ? `(${dobFormatted})` : ''}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-medium text-stone-500">Jenis Kelamin</dt>
              <dd className="mt-0.5 text-stone-800">{formatGender(appointment.gender)}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-medium text-stone-500">Nomor Telepon / HP</dt>
              <dd className="mt-0.5 text-stone-800">{appointment.phone || '-'}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-medium text-stone-500">Alamat Domisili</dt>
              <dd className="mt-0.5 text-stone-800">{patientAddress}</dd>
            </div>
          </dl>
        </section>

        {/* Detail Jadwal */}
        <section className="mt-4 border border-stone-200/70 bg-white p-4 print:break-inside-avoid sm:p-5">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">
            Detail Jadwal Kunjungan
          </h3>
          <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[10px] font-medium text-stone-500">Fisioterapis</dt>
              <dd className="mt-0.5 font-bold text-[#181700]">
                {appointment.therapistName ?? 'Belum ditentukan'}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-medium text-stone-500">Jenis Kunjungan</dt>
              <dd className="mt-0.5 text-stone-800">
                {typeLabel[appointment.type as keyof typeof typeLabel] ?? appointment.type}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-medium text-stone-500">Status</dt>
              <dd className="mt-0.5">
                <span
                  className={`inline-flex border px-2.5 py-0.5 text-[10px] font-bold ${
                    statusColor[appointment.status as keyof typeof statusColor] ??
                    'bg-stone-100 text-stone-700 border-stone-200/70'
                  }`}
                >
                  {statusLabel[appointment.status as keyof typeof statusLabel] ?? appointment.status}
                </span>
              </dd>
            </div>
            {appointment.administrativeNote ? (
              <div className="sm:col-span-2">
                <dt className="text-[10px] font-medium text-stone-500">Catatan Petugas</dt>
                <dd className="mt-0.5 whitespace-pre-wrap text-stone-800">{appointment.administrativeNote}</dd>
              </div>
            ) : null}
          </dl>
        </section>

        {/* Catatan Penting */}
        <section className="mt-4 border border-stone-300 bg-stone-50 p-4 print:break-inside-avoid">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#181700]">Catatan Penting</h3>
          <ul className="mt-2 space-y-1 text-[11px] leading-relaxed text-stone-600">
            <li>&bull; Harap hadir 10 menit sebelum waktu yang dijadwalkan.</li>
            <li>&bull; Bawa kartu identitas dan kartu asuransi (jika ada).</li>
            <li>&bull; Hubungi klinik jika perlu mengubah atau membatalkan jadwal.</li>
          </ul>
        </section>

        <PrintFooter signerName="Hafta Fisioterapi" />
      </div>
    </div>
  );
}
