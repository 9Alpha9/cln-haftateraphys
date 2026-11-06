'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileHeart,
  MessageCircle,
  CalendarPlus,
  TrendingUp,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PatientTherapyCalendar } from '@/components/patient/patient-therapy-calendar';
import {
  PatientHelpCard,
  PatientIntakeCard,
  PatientNextSessionCard,
  PatientProgressCard,
  PatientProgressPanel,
  PatientTodayCard,
} from '@/components/patient/patient-dashboard-cards';
import { useToast } from '@/components/ui/toast';
import { cancelPatientAppointmentRequest } from '@/server/actions/appointment-requests';
import type {
  AvailabilityDate,
  PatientAppointmentRequestView,
  PatientPortalAppointment,
} from '@/server/queries/patient-portal';
import type { TherapyProgressView } from '@/server/queries/therapy-progress';
import type { IndonesianHoliday } from '@/server/queries/indonesian-holidays';
import { cn } from '@/lib/utils';

type IntakeInfo = {
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'NEEDS_REVISION' | 'ACCEPTED' | 'ARCHIVED';
  reviewMessage: string | null;
} | null;

const INTAKE_COPY: Record<
  NonNullable<IntakeInfo>['status'],
  { badge: string; title: string; action: string; done: boolean }
> = {
  DRAFT: {
    badge: 'Draft',
    title: 'Lengkapi Form Awal',
    action: 'Lanjutkan Form Awal',
    done: false,
  },
  NEEDS_REVISION: {
    badge: 'Perlu perbaikan',
    title: 'Form Awal perlu diperbaiki',
    action: 'Perbaiki Form Awal',
    done: false,
  },
  SUBMITTED: {
    badge: 'Terkirim',
    title: 'Form Awal menunggu tinjauan',
    action: 'Lihat Form Awal',
    done: true,
  },
  UNDER_REVIEW: {
    badge: 'Sedang ditinjau',
    title: 'Form Awal sedang ditinjau',
    action: 'Lihat Form Awal',
    done: true,
  },
  ACCEPTED: {
    badge: 'Diterima',
    title: 'Form Awal sudah diterima',
    action: 'Lihat Form Awal',
    done: true,
  },
  ARCHIVED: {
    badge: 'Arsip',
    title: 'Form episode sebelumnya',
    action: 'Lihat Form Awal',
    done: true,
  },
};

function toDateKey(value: Date | string) {
  if (typeof value === 'string') return value.slice(0, 10);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(
    value.getDate(),
  ).padStart(2, '0')}`;
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

function formatShortDate(value: Date | string) {
  const date = typeof value === 'string' ? new Date(`${value.slice(0, 10)}T00:00:00`) : value;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function formatTime(value: string) {
  return value.slice(0, 5);
}

export function PatientDashboardOverview({
  userName,
  treatmentGoal,
  intake,
  appointments,
  requests,
  availability,
  records,
  totalRecords,
  holidays,
}: {
  userName?: string | null;
  treatmentGoal: string | null;
  intake: IntakeInfo;
  appointments: PatientPortalAppointment[];
  requests: PatientAppointmentRequestView[];
  availability: AvailabilityDate[];
  records: TherapyProgressView[];
  totalRecords: number;
  holidays: IndonesianHoliday[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
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
  const intakeNeedsAttention = !intakeCopy || !intakeCopy.done;
  const completed = appointments.filter((appointment) => appointment.status === 'COMPLETED').length;
  const scheduled = appointments.filter(
    (appointment) =>
      ['SCHEDULED', 'CONFIRMED'].includes(appointment.status) &&
      toDateKey(appointment.scheduledDate) >= today,
  ).length;
  const todaySessions = appointments
    .filter((appointment) => toDateKey(appointment.scheduledDate) === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const [statusSlideOpen, setStatusSlideOpen] = useState(false);
  const [statusRequest, setStatusRequest] = useState<PatientAppointmentRequestView | null>(null);
  const [statusPending, startStatusTransition] = useTransition();

  function openStatusDetail(request: PatientAppointmentRequestView) {
    setStatusRequest(request);
    setStatusSlideOpen(true);
  }

  function cancelStatusRequest(requestId: string) {
    startStatusTransition(async () => {
      try {
        await cancelPatientAppointmentRequest(requestId);
        setStatusSlideOpen(false);
        setStatusRequest(null);
        showToast('success', 'Pengajuan jadwal dibatalkan.');
        router.refresh();
      } catch (error) {
        showToast(
          'error',
          error instanceof Error ? error.message : 'Pengajuan tidak dapat dibatalkan.',
        );
      }
    });
  }

  const todayItems: { label: string; hint: string; state: 'done' | 'pending' | 'waiting' | 'empty' }[] =
    [];

  if (todaySessions.length > 0) {
    todaySessions.slice(0, 2).forEach((session) => {
      todayItems.push({
        label: `Sesi ${formatTime(session.startTime)}`,
        hint: `${session.therapistName ?? 'Fisioterapis Hafta'}`,
        state: session.status === 'COMPLETED' ? 'done' : 'pending',
      });
    });
  } else {
    todayItems.push({
      label: 'Tidak ada sesi hari ini',
      hint: upcoming
        ? `Sesi berikutnya ${formatShortDate(upcoming.scheduledDate)}`
        : 'Ajukan jadwal terapi',
      state: 'empty',
    });
  }

  todayItems.push({
    label: intakeNeedsAttention ? 'Lengkapi Form Awal' : 'Form Awal',
    hint: intakeNeedsAttention ? 'Diperlukan sebelum asesmen' : 'Sudah ditinjau tim Hafta',
    state: intakeNeedsAttention ? 'pending' : 'done',
  });

  if (pendingRequest) {
    todayItems.push({
      label: 'Pengajuan jadwal',
      hint: `${formatShortDate(pendingRequest.requestedDate)} · ${formatTime(pendingRequest.startTime)} · menunggu ACC`,
      state: 'waiting',
    });
  }

  const doneCount = todayItems.filter((item) => item.state === 'done').length;

  return (
    <div className="w-full space-y-4 pb-6 sm:space-y-5">
      <header className="flex flex-col gap-4 border-b border-stone-200/90 pb-3 pt-3 sm:flex-row sm:items-end sm:justify-between sm:pb-5 sm:pt-4">
        <div className="min-w-0 flex-1">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-[#F4F4F1] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-600 sm:hidden">
            <CalendarDays className="h-3 w-3" />
            {formatLongDate(today)}
          </p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#181700] sm:text-3xl">
            Halo, {userName?.split(' ')[0] || 'Pasien'}
          </h1>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-stone-500 sm:text-sm">
            {upcoming
              ? `Sesi berikutnya ${formatLongDate(upcoming.scheduledDate)} pukul ${formatTime(upcoming.startTime)}.`
              : 'Belum ada jadwal terapi. Ajukan sesi pertama Anda.'}
            {pendingRequest ? ' Ada pengajuan jadwal yang menunggu konfirmasi.' : ''}
            {intakeNeedsAttention ? ' Form Awal belum lengkap.' : ''}
          </p>
        </div>
        <div className="flex w-full flex-row items-center gap-2 sm:w-auto sm:shrink-0">
          <Link
            href="/dashboard/appointments"
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-[var(--hafta-ylw-100)] px-3 text-xs font-bold text-[#181700] shadow-2xs transition-colors hover:bg-[var(--hafta-ylw-200)] sm:flex-none sm:px-4"
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            Jadwalkan Sesi
          </Link>
          <Link
            href="/dashboard/intake"
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 text-xs font-bold text-[#181700] transition-colors hover:bg-stone-50 sm:flex-none sm:px-4"
          >
            {intakeNeedsAttention ? 'Isi Form Awal' : 'Lihat Form Awal'}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <h2 className="sr-only">Ringkasan dashboard pasien</h2>

      <section
        aria-label="Ringkasan cepat"
        className="-mx-3 flex touch-pan-x snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-3 pb-1 scroll-px-3 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0 lg:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <PatientNextSessionCard
          upcoming={upcoming ?? null}
          pendingRequest={pendingRequest ?? null}
          onOpenStatus={() => pendingRequest && openStatusDetail(pendingRequest)}
        />
        <PatientIntakeCard
          badge={intakeCopy?.badge ?? 'Belum diisi'}
          title={intakeCopy?.title ?? 'Mulai dari Form Awal'}
          action={intakeCopy?.action ?? 'Isi Form Awal'}
          needsAttention={intakeNeedsAttention}
        />
        <PatientProgressCard completed={completed} scheduled={scheduled} />
        <PatientTodayCard items={todayItems} done={doneCount} />
      </section>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12">
        <div className="min-w-0 space-y-4 sm:space-y-5 lg:col-span-8">
          <section className="-mx-3 rounded-none border-y border-stone-200/90 bg-white p-3 sm:mx-0 sm:rounded-3xl sm:border sm:p-5">
            <div className="px-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">
                  Kalender
                </p>
                <Link
                  href="/dashboard/appointments"
                  className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full border border-stone-200/70 bg-[#FAFAF8] px-3 text-[11px] font-bold text-[#181700] transition-colors hover:bg-stone-100"
                >
                  Semua jadwal
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <h2 className="mt-1 text-base font-bold text-[#181700]">Jadwal & slot terapi</h2>
              <p className="mt-1 text-xs leading-relaxed text-stone-500">
                Pilih tanggal untuk melihat sesi, mengubah jadwal, atau mengajukan sesi tambahan.
              </p>
            </div>
            <div className="mt-3">
              <PatientTherapyCalendar
                appointments={appointments}
                requests={requests}
                availability={availability}
                holidays={holidays}
                hideHeader
              />
            </div>
          </section>

          <section className="rounded-3xl border border-stone-200/90 bg-white p-3.5 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">
                  Catatan
                </p>
                <h2 className="mt-1 text-base font-bold text-[#181700]">Rekam medis terbaru</h2>
                <p className="mt-1 text-xs leading-relaxed text-stone-500">
                  Ringkasan yang dibagikan fisioterapis setelah sesi Anda.
                </p>
              </div>
              <Link
                href="/dashboard/progress"
                className="inline-flex h-10 shrink-0 items-center gap-1 px-1 text-xs font-semibold text-[#181700] underline-offset-4 hover:underline"
              >
                Semua
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {records.length === 0 ? (
              <div className="mt-4 flex flex-col items-center justify-center rounded-2xl bg-[#FAFAF8] px-4 sm:px-5 py-8 text-center">
                <FileHeart className="h-7 w-7 text-stone-300" />
                <p className="mt-3 text-sm font-semibold text-[#181700]">Belum ada rekam medis</p>
                <p className="mt-1 max-w-sm text-xs leading-relaxed text-stone-500">
                  Catatan akan muncul setelah fisioterapis menyelesaikan dan membagikan hasil sesi
                  Anda.
                </p>
              </div>
            ) : (
              <div className="mt-3 divide-y divide-stone-100">
                {records.map((record) => (
                  <Link
                    key={record.id}
                    href="/dashboard/progress"
                    className="group flex items-start gap-3 py-3.5 first:pt-2 last:pb-0"
                  >
                    <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-2xl bg-[var(--hafta-ylw-50)] text-[#181700]">
                      <span className="text-sm font-extrabold leading-none">
                        {record.recordedAt.getDate()}
                      </span>
                      <span className="mt-0.5 text-[9px] font-semibold uppercase">
                        {record.recordedAt.toLocaleDateString('id-ID', { month: 'short' })}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-sm font-bold text-[#181700]">Sesi terapi</span>
                        <span className="text-[11px] text-stone-400">
                          {formatShortDate(record.recordedAt)}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-stone-500">
                        {record.therapistName ?? 'Fisioterapis Hafta'}
                        {record.summary ? ` · ${record.summary}` : ''}
                      </span>
                      <span className="mt-1 flex flex-wrap gap-3 text-[11px] text-stone-500">
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

        <aside className="-mx-2 min-w-0 space-y-4 sm:mx-0 lg:col-span-4 lg:sticky lg:top-[88px] lg:self-start">
          <PatientProgressPanel
            appointments={appointments}
            requests={requests}
            records={records}
            totalRecords={totalRecords}
            treatmentGoal={treatmentGoal}
          />
          <PatientHelpCard />
        </aside>
      </div>

      <ConfirmDialog
        isOpen={statusSlideOpen}
        onCancel={() => setStatusSlideOpen(false)}
        onConfirm={() => cancelStatusRequest(statusRequest?.id ?? '')}
        title="Status pengajuan jadwal"
        confirmLabel="Batalkan pengajuan"
        cancelLabel="Tutup"
        pending={statusPending}
        icon={<MessageCircle className="h-5 w-5 text-[#181700]" />}
        iconClassName="h-10 w-10 aspect-square shrink-0 items-center justify-center rounded-full bg-[var(--hafta-ylw-100)] text-[#181700]"
        panelClassName="rounded-3xl border border-stone-200/90 shadow-2xl"
        confirmClassName="h-10 px-4 rounded-full border border-red-200 bg-white hover:bg-red-50 text-red-700 text-xs font-bold inline-flex items-center justify-center cursor-pointer transition-all whitespace-nowrap"
        cancelClassName="h-10 px-4 rounded-full bg-[var(--hafta-ylw-100)] hover:bg-[var(--hafta-ylw-200)] text-[#181700] text-xs font-bold inline-flex items-center justify-center cursor-pointer transition-all whitespace-nowrap"
        description={
          <div className="mt-3 divide-y divide-stone-200/70 rounded-2xl border border-stone-200/80 bg-[#F8F8F5] p-3 text-left sm:p-4">
            <div className="flex items-center justify-between gap-2 pb-3">
              <span className="text-xs font-medium text-stone-500">Status</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--hafta-ylw-100)] px-3 py-1 text-[11px] font-bold text-[#181700]">
                <CheckCircle2 className="h-3 w-3" />
                Menunggu ACC
              </span>
            </div>
            {statusRequest?.rescheduleFromDate ? (
              <div className="flex flex-col gap-0.5 py-3">
                <span className="text-[11px] font-medium text-stone-500">Jadwal semula</span>
                <span className="text-xs font-bold text-[#181700] sm:text-sm">
                  {formatLongDate(statusRequest.rescheduleFromDate)} ·{' '}
                  {formatTime(statusRequest.rescheduleFromTime ?? '')}
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5 py-3">
                <span className="text-[11px] font-medium text-stone-500">Jenis</span>
                <span className="text-xs font-bold text-[#181700] sm:text-sm">Sesi tambahan</span>
              </div>
            )}
            <div className="flex flex-col gap-0.5 pt-3">
              <span className="text-[11px] font-medium text-stone-500">Jadwal diajukan</span>
              <span className="text-xs font-bold text-[#181700] sm:text-sm">
                {statusRequest ? formatLongDate(statusRequest.requestedDate) : '-'} ·{' '}
                {statusRequest ? formatTime(statusRequest.startTime) : '-'}
              </span>
              <span className="text-[11px] text-stone-500">
                {statusRequest?.therapistName ?? 'Fisioterapis Hafta'}
              </span>
            </div>
          </div>
        }
      />

    </div>
  );
}
