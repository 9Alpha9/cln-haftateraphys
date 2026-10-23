import Link from 'next/link';
import {
  ArrowUpRight,
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  ClipboardList,
  Clock3,
  FileHeart,
  LayoutDashboard,
  Plus,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { NotchedCard } from '@/components/ui/notched-card';
import { PatientDashboardProgressHub } from '@/components/patient/patient-dashboard-progress-hub';
import type {
  PatientAppointmentRequestView,
  PatientPortalAppointment,
} from '@/server/queries/patient-portal';
import type { TherapyProgressView } from '@/server/queries/therapy-progress';

type IntakeInfo = {
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'NEEDS_REVISION' | 'ACCEPTED' | 'ARCHIVED';
  reviewMessage: string | null;
} | null;

const INTAKE_COPY: Record<
  NonNullable<IntakeInfo>['status'],
  { badge: string; title: string; description: string; action: string }
> = {
  DRAFT: {
    badge: 'Draft',
    title: 'Lanjutkan Form Awal',
    description:
      'Form awal Anda belum dikirim. Lengkapi jawaban agar fisioterapis dapat menyiapkan asesmen yang tepat.',
    action: 'Lanjutkan Form Awal',
  },
  NEEDS_REVISION: {
    badge: 'Perlu perbaikan',
    title: 'Form Awal perlu diperbaiki',
    description:
      'Ada catatan dari tim Hafta. Buka form, perbaiki bagian yang diminta, lalu kirim ulang.',
    action: 'Perbaiki Form Awal',
  },
  SUBMITTED: {
    badge: 'Terkirim',
    title: 'Form Awal sedang ditinjau',
    description:
      'Jawaban Anda sudah diterima dan sedang menunggu tinjauan fisioterapis. Anda masih dapat memperbarui data.',
    action: 'Lihat Form Awal',
  },
  UNDER_REVIEW: {
    badge: 'Sedang ditinjau',
    title: 'Form Awal sedang ditinjau',
    description:
      'Fisioterapis sedang mempelajari keluhan awal Anda sebelum sesi asesmen di klinik.',
    action: 'Lihat Form Awal',
  },
  ACCEPTED: {
    badge: 'Diterima',
    title: 'Form Awal sudah diterima',
    description:
      'Informasi awal Anda telah diverifikasi dan menjadi acuan program terapi. Ajukan episode baru bila ada keluhan berbeda.',
    action: 'Akses Formulir',
  },
  ARCHIVED: {
    badge: 'Arsip',
    title: 'Episode form sebelumnya',
    description:
      'Form ini telah diarsipkan sebagai riwayat. Buat episode keluhan baru jika Anda membutuhkan program terapi baru.',
    action: 'Akses Formulir',
  },
};

function toDateKey(value: Date | string) {
  if (typeof value === 'string') return value.slice(0, 10);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

function formatLongDate(value: Date | string) {
  const date = typeof value === 'string' ? new Date(`${value.slice(0, 10)}T00:00:00`) : value;
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatShortDate(value: Date) {
  return value.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function PatientDashboardOverview({
  userName,
  treatmentGoal,
  intake,
  appointments,
  requests,
  records,
  totalRecords,
}: {
  userName?: string | null;
  treatmentGoal: string | null;
  intake: IntakeInfo;
  appointments: PatientPortalAppointment[];
  requests: PatientAppointmentRequestView[];
  records: TherapyProgressView[];
  totalRecords: number;
}) {
  const today = toDateKey(new Date());
  const upcoming = appointments
    .filter(
      (appointment) =>
        ['SCHEDULED', 'CONFIRMED'].includes(appointment.status) &&
        toDateKey(appointment.scheduledDate) >= today,
    )
    .sort((a, b) =>
      `${toDateKey(a.scheduledDate)}${a.startTime}`.localeCompare(
        `${toDateKey(b.scheduledDate)}${b.startTime}`,
      ),
    )[0];
  const pendingRequest = requests.find((request) => request.status === 'PENDING');
  const intakeCopy = intake ? INTAKE_COPY[intake.status] : null;

  return (
    <div className="w-full space-y-6">
      <DashboardPageHeader
        title="Dashboard Pasien"
        description={`Selamat datang kembali, ${userName || 'Pasien'}. Pantau jadwal terapi, target, dan perkembangan Anda dalam satu tempat.`}
        breadcrumbs={[{ label: 'Dashboard' }]}
        icon={<LayoutDashboard />}
        action={
          <>
            <span className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--hafta-grn-200)] bg-[var(--hafta-grn-50)] px-3.5 text-xs font-semibold text-[var(--hafta-grn-700)]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Akun Aktif
            </span>
            <Link
              href="/dashboard/appointments"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#181700] px-4 text-xs font-bold text-white transition-colors hover:bg-[var(--hafta-ylw-100)] hover:text-[#181700]"
            >
              <Plus className="h-4 w-4" />
              Ajukan Jadwal Terapi
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="min-w-0 space-y-6 lg:col-span-8">
          <section className="grid gap-4 xl:grid-cols-2">
            <NotchedCard
              variant="accent"
              icon={<CalendarDays className="h-5 w-5" />}
              badge={pendingRequest ? 'Menunggu konfirmasi' : 'Sesi terapi'}
              title={
                upcoming
                  ? formatLongDate(upcoming.scheduledDate)
                  : pendingRequest
                    ? formatLongDate(pendingRequest.requestedDate)
                    : 'Ajukan jadwal terapi'
              }
              description={
                upcoming ? (
                  <span className="space-y-1.5">
                    <span className="flex items-center gap-1.5">
                      <Clock3 className="h-4 w-4" />
                      {upcoming.startTime} · {upcoming.durationMinutes} menit
                    </span>
                    <span className="flex items-center gap-1.5">
                      <UserRound className="h-4 w-4" />
                      {upcoming.therapistName ?? 'Fisioterapis Hafta'}
                    </span>
                  </span>
                ) : pendingRequest ? (
                  `Pengajuan ${pendingRequest.startTime} sedang menunggu konfirmasi tim Hafta.`
                ) : (
                  'Pilih tanggal dan jam yang tersedia, lalu ajukan jadwal langsung dari halaman jadwal.'
                )
              }
              href="/dashboard/appointments"
              buttonText={pendingRequest ? 'Lihat Status Jadwal' : 'Ajukan Jadwal'}
              showRings
            />

            {intakeCopy ? (
              <NotchedCard
                variant="white"
                icon={<ClipboardList className="h-5 w-5" />}
                badge={intakeCopy.badge}
                title={intakeCopy.title}
                description={
                  <>
                    {intakeCopy.description}
                    {intake?.reviewMessage ? (
                      <span className="mt-2 block rounded-lg bg-[var(--hafta-red-50)] px-3 py-2 text-xs font-medium text-[var(--hafta-red-700)]">
                        Catatan fisioterapis: {intake.reviewMessage}
                      </span>
                    ) : null}
                  </>
                }
                href="/dashboard/intake"
                buttonText={intakeCopy.action}
              />
            ) : (
              <NotchedCard
                variant="white"
                icon={<ClipboardList className="h-5 w-5" />}
                badge="Langkah pertama"
                title="Mulai dari Form Awal"
                description="Ceritakan keluhan awal Anda satu kali per episode agar fisioterapis dapat menyiapkan asesmen yang sesuai."
                href="/dashboard/intake"
                buttonText="Isi Form Awal"
              />
            )}
          </section>

          <section className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#181700]">Rekam Medis Terbaru</h2>
                <p className="mt-1 text-xs text-stone-500">
                  Catatan perkembangan yang dibagikan fisioterapis Anda.
                </p>
              </div>
              <Link
                href="/dashboard/progress"
                className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#181700] underline-offset-4 hover:underline"
              >
                Semua
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {records.length === 0 ? (
              <div className="mt-5 flex flex-col items-center justify-center rounded-2xl bg-[#FAFAF8] px-5 py-10 text-center">
                <FileHeart className="h-7 w-7 text-stone-300" />
                <p className="mt-3 text-sm font-semibold text-[#181700]">Belum ada rekam medis</p>
                <p className="mt-1 max-w-sm text-xs leading-relaxed text-stone-500">
                  Catatan akan muncul setelah fisioterapis menyelesaikan dan membagikan hasil sesi Anda.
                </p>
              </div>
            ) : (
              <div className="mt-4 divide-y divide-stone-100">
                {records.map((record) => (
                  <Link
                    key={record.id}
                    href="/dashboard/progress"
                    className="group flex items-start gap-3.5 py-4 first:pt-2 last:pb-0"
                  >
                    <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-full bg-[var(--hafta-ylw-50)] text-[#181700]">
                      <span className="text-sm font-extrabold leading-none">
                        {record.recordedAt.getDate()}
                      </span>
                      <span className="mt-0.5 text-[9px] font-semibold uppercase">
                        {record.recordedAt.toLocaleDateString('id-ID', { month: 'short' })}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-sm font-bold text-[#181700]">Sesi Terapi</span>
                        <span className="text-[11px] text-stone-400">
                          {formatShortDate(record.recordedAt)}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-stone-500">
                        {record.therapistName ?? 'Fisioterapis Hafta'}
                        {record.summary ? ` · ${record.summary}` : ''}
                      </span>
                      <span className="mt-1.5 flex flex-wrap gap-3 text-[11px] text-stone-500">
                        <span>
                          Nyeri <strong className="text-[#181700]">{record.painScore}/10</strong>
                        </span>
                        <span>
                          Fungsi <strong className="text-[#181700]">{record.functionScore}/10</strong>
                        </span>
                      </span>
                    </span>
                    <ChevronRight className="mt-3 h-4 w-4 shrink-0 text-stone-300 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="min-w-0 lg:col-span-4 lg:sticky lg:top-[88px] lg:self-start">
          <PatientDashboardProgressHub
            treatmentGoal={treatmentGoal}
            appointments={appointments}
            requests={requests}
            records={records}
            totalRecords={totalRecords}
          />
        </aside>
      </div>
    </div>
  );
}
