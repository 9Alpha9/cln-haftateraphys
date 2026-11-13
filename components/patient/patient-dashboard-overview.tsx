'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileHeart,
  LockKeyhole,
  Printer,
  Stethoscope,
  UserRound,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PatientBookingPanel } from '@/components/patient/patient-booking-panel';
import { useToast } from '@/components/ui/toast';
import { cancelPatientAppointmentRequest } from '@/server/actions/appointment-requests';
import type {
  AvailabilityDate,
  PatientAppointmentRequestView,
  PatientPortalAppointment,
} from '@/server/queries/patient-portal';
import type { TherapyProgressView } from '@/server/queries/therapy-progress';

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

function formatDateTimeWithTime(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  const day = date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const time = date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${day} · ${time.replace('.', ':')} WIB`;
}

function formatTime(value: string) {
  return value.slice(0, 5);
}

type ScheduleView = {
  pending: boolean;
  therapistName: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  type: string;
  request: PatientAppointmentRequestView | null;
};

export function PatientDashboardOverview({
  userName,
  appointments,
  requests,
  availability,
  records,
}: {
  userName?: string | null;
  appointments: PatientPortalAppointment[];
  requests: PatientAppointmentRequestView[];
  availability: AvailabilityDate[];
  records: TherapyProgressView[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [cancelPending, startCancelTransition] = useTransition();

  const today = toDateKey(new Date());
  const pendingRequest = requests.find((request) => request.status === 'PENDING') ?? null;
  const upcoming =
    appointments
      .filter(
        (appointment) =>
          ['SCHEDULED', 'CONFIRMED'].includes(appointment.status) &&
          toDateKey(appointment.scheduledDate) >= today,
      )
      .sort((a, b) =>
        `${toDateKey(a.scheduledDate)}${a.startTime}`.localeCompare(
          `${toDateKey(b.scheduledDate)}${b.startTime}`,
        ),
      )[0] ?? null;

  const hasActiveSchedule = Boolean(upcoming);
  const showBookingPanel =
    (!hasActiveSchedule && !pendingRequest) || (isRescheduling && !pendingRequest);

  const schedule: ScheduleView | null = pendingRequest
    ? {
        pending: true,
        therapistName: pendingRequest.therapistName ?? 'Fisioterapis Hafta',
        date: pendingRequest.requestedDate,
        startTime: pendingRequest.startTime,
        durationMinutes: pendingRequest.durationMinutes,
        type: pendingRequest.type,
        request: pendingRequest,
      }
    : upcoming
      ? {
          pending: false,
          therapistName: upcoming.therapistName ?? 'Fisioterapis Hafta',
          date: upcoming.scheduledDate,
          startTime: upcoming.startTime,
          durationMinutes: upcoming.durationMinutes,
          type: upcoming.type,
          request: null,
        }
      : null;

  function handleCancelPendingRequest() {
    if (!pendingRequest) return;
    startCancelTransition(async () => {
      try {
        await cancelPatientAppointmentRequest(pendingRequest.id);
        setDetailOpen(false);
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

  return (
    <div className="w-full space-y-4 pb-8 sm:space-y-5">
      {/* ── 1. HEADER SAPAAN ── */}
      <header className="border-b border-stone-200/90 pb-4 pt-3 sm:pb-6 sm:pt-4">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-[#F4F4F1] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-600 sm:hidden">
          <CalendarDays className="h-3 w-3" />
          {formatLongDate(today)}
        </p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#181700] sm:text-3xl">
          Halo, {userName?.split(' ')[0] || 'Pasien'}
        </h1>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-stone-500 sm:text-sm">
          Pilih jadwal terapi Anda bersama fisioterapis kami dan pantau hasil evaluasi rekam medis
          Anda.
        </p>
      </header>

      {/* ── 2. JADWAL TERAPI (SMART STATE) ── */}
      <section aria-label="Jadwal terapi">
        {showBookingPanel ? (
          <PatientBookingPanel
            availability={availability}
            mode={isRescheduling ? 'RESCHEDULE' : 'CREATE'}
            rescheduleAppointment={isRescheduling ? upcoming : null}
            onRescheduleCancel={() => setIsRescheduling(false)}
            onRequestSubmitted={() => setIsRescheduling(false)}
          />
        ) : schedule ? (
          <article className="rounded-3xl border border-stone-200/80 bg-white p-4 shadow-[0_8px_30px_rgba(24,23,0,0.05)] sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">
                  Jadwal Terapi Anda
                </p>
                <h2 className="mt-1 text-base font-bold text-[#181700]">
                  {schedule.pending ? 'Pengajuan Jadwal Terapi' : 'Sesi Terapi Terjadwal'}
                </h2>
              </div>
              {schedule.pending ? (
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[var(--hafta-org-300)] bg-[var(--hafta-org-50)] px-3 py-1 text-[10px] font-bold text-[#181700]">
                  <Clock3 className="h-3 w-3" />
                  Menunggu Konfirmasi Terapis
                </span>
              ) : (
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[var(--hafta-grn-200)] bg-[var(--hafta-grn-50)] px-3 py-1 text-[10px] font-bold text-[var(--hafta-grn-700)]">
                  <CheckCircle2 className="h-3 w-3" />
                  Terjadwal Resmi
                </span>
              )}
            </div>

            <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-[#FAFAF8] px-3.5 py-3">
                <dt className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-stone-500">
                  <UserRound className="h-3.5 w-3.5" />
                  Fisioterapis
                </dt>
                <dd className="mt-1 truncate text-sm font-bold text-[#181700]">
                  {schedule.therapistName}
                </dd>
              </div>
              <div className="rounded-2xl bg-[#FAFAF8] px-3.5 py-3">
                <dt className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-stone-500">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Hari &amp; Tanggal
                </dt>
                <dd className="mt-1 text-sm font-bold text-[#181700]">
                  {formatLongDate(schedule.date)}
                </dd>
              </div>
              <div className="rounded-2xl bg-[#FAFAF8] px-3.5 py-3">
                <dt className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-stone-500">
                  <Clock3 className="h-3.5 w-3.5" />
                  Jam &amp; Durasi
                </dt>
                <dd className="mt-1 text-sm font-bold text-[#181700]">
                  {formatTime(schedule.startTime)} WIB · {schedule.durationMinutes} menit
                </dd>
              </div>
            </dl>

            <div className="mt-5 flex flex-col gap-2.5 border-t border-stone-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  disabled={schedule.pending}
                  onClick={() => setIsRescheduling(true)}
                  className={
                    schedule.pending
                      ? 'inline-flex h-11 cursor-not-allowed items-center justify-center gap-2 rounded-full border border-stone-200 bg-stone-100 px-6 text-sm font-bold text-stone-400'
                      : 'inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--hafta-org-100)] px-6 text-sm font-bold text-[#181700] transition-colors hover:bg-[var(--hafta-org-200)] focus-visible:border-[#181700] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-org-200)]/35'
                  }
                >
                  {schedule.pending ? (
                    <>
                      <LockKeyhole className="h-4 w-4" />
                      Menunggu ACC Terapis
                    </>
                  ) : (
                    <>
                      <CalendarPlus className="h-4 w-4" />
                      Ubah Jadwal
                    </>
                  )}
                </button>
                {schedule.pending ? (
                  <p className="text-[10px] leading-relaxed text-stone-500">
                    Perubahan jadwal dapat dilakukan setelah terapis mengonfirmasi pengajuan ini.
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setDetailOpen(true)}
                className="inline-flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-stone-200 bg-white px-5 text-xs font-semibold text-[#181700] transition-colors hover:bg-stone-50 focus-visible:border-[#181700] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-org-200)]/35"
              >
                Lihat Detail
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </article>
        ) : null}
      </section>

      {/* ── 3. REKAM MEDIS & EVALUASI ── */}
      <section
        aria-label="Rekam medis dan evaluasi terapi"
        className="rounded-3xl border border-stone-200/80 bg-white p-4 shadow-[0_8px_30px_rgba(24,23,0,0.05)] sm:p-5"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">
              Rekam Medis
            </p>
            <h2 className="mt-1 text-base font-bold text-[#181700]">
              Rekam Medis &amp; Evaluasi Terapi
            </h2>
          </div>
          <Link
            href="/dashboard/progress"
            className="inline-flex w-fit items-center gap-1 rounded text-xs font-bold text-[#181700] underline-offset-4 hover:underline focus-visible:border-[#181700] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-org-200)]/35"
          >
            Lihat Semua Rekam Medis
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {records.length === 0 ? (
          <div className="mt-4 flex flex-col items-center justify-center rounded-2xl bg-[#FAFAF8] px-4 py-8 text-center sm:px-5">
            <FileHeart className="h-8 w-8 text-stone-300" />
            <p className="mt-3 text-sm font-semibold text-[#181700]">Belum ada rekam medis</p>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-stone-500">
              Catatan evaluasi rekam medis dari fisioterapis akan muncul di sini setelah sesi terapi
              selesai.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {records.map((record) => (
              <article
                key={record.id}
                className="rounded-2xl border border-stone-200/80 bg-[#FAFAF8]/60 p-3.5 sm:p-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-stone-500">
                      Evaluasi Terapi
                    </p>
                    <h3 className="mt-1 text-sm font-bold text-[#181700]">
                      {formatLongDate(record.recordedAt)}
                    </h3>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-stone-500">
                      <UserRound className="h-3.5 w-3.5 shrink-0" />
                      {record.therapistName ?? 'Fisioterapis Hafta'}
                    </p>
                  </div>
                  <span className="inline-flex w-fit items-center gap-1 rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-stone-600">
                    <Stethoscope className="h-3 w-3" />
                    {record.status === 'FINALIZED' ? 'Final' : 'Draft'}
                  </span>
                </div>

                <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-stone-600">
                  <span className="font-semibold text-[#181700]">Diagnosis: </span>
                  {record.diagnosis || record.summary || 'Belum dicatat'}
                </p>

                <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { label: 'Nyeri', value: `${record.painScore}/10` },
                    { label: 'ROM', value: `${record.rangeOfMotionScore}/10` },
                    { label: 'Kekuatan', value: `${record.strengthScore}/10` },
                    { label: 'Fungsi', value: `${record.functionScore}/10` },
                  ].map((metric) => (
                    <div key={metric.label} className="rounded-xl bg-white px-2.5 py-2">
                      <dt className="text-[10px] text-stone-500">{metric.label}</dt>
                      <dd className="mt-0.5 text-sm font-extrabold text-[#181700]">
                        {metric.value}
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-3 flex justify-end">
                  <Link
                    href={`/dashboard/progress/${record.id}/print`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 text-[11px] font-semibold text-[#181700] transition-colors hover:bg-stone-100 focus-visible:border-[#181700] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-org-200)]/35"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Lihat Detail / Cetak
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ── DETAIL MODAL ── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md gap-0 overflow-hidden rounded-3xl border-stone-200/90 p-0">
          <DialogHeader className="border-b border-stone-100 p-5 text-left">
            <DialogTitle className="text-base font-bold text-[#181700]">
              Detail Jadwal Terapi
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-500">
              Rincian jadwal dan status pengajuan terapi Anda.
            </DialogDescription>
          </DialogHeader>

          {schedule ? (
            <div className="space-y-3 p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-stone-500">Status</span>
                {schedule.pending ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--hafta-org-100)] px-3 py-1 text-[11px] font-bold text-[#181700]">
                    <Clock3 className="h-3 w-3" />
                    Menunggu Konfirmasi Terapis
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--hafta-grn-50)] px-3 py-1 text-[11px] font-bold text-[var(--hafta-grn-700)]">
                    <CheckCircle2 className="h-3 w-3" />
                    Terjadwal Resmi
                  </span>
                )}
              </div>

              <div className="divide-y divide-stone-200/70 rounded-2xl border border-stone-200/80 bg-[#F8F8F5] p-3 text-left sm:p-4">
                <div className="flex flex-col gap-0.5 pb-3">
                  <span className="text-[11px] font-medium text-stone-500">Fisioterapis</span>
                  <span className="text-xs font-bold text-[#181700] sm:text-sm">
                    {schedule.therapistName}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 py-3">
                  <span className="text-[11px] font-medium text-stone-500">Hari &amp; Tanggal</span>
                  <span className="text-xs font-bold text-[#181700] sm:text-sm">
                    {formatLongDate(schedule.date)}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 py-3">
                  <span className="text-[11px] font-medium text-stone-500">Jam &amp; Durasi</span>
                  <span className="text-xs font-bold text-[#181700] sm:text-sm">
                    {formatTime(schedule.startTime)} WIB · {schedule.durationMinutes} menit
                  </span>
                </div>
                {schedule.pending && schedule.request?.rescheduleFromDate ? (
                  <div className="flex flex-col gap-0.5 pt-3">
                    <span className="text-[11px] font-medium text-stone-500">Jadwal Semula</span>
                    <span className="text-xs font-bold text-[#181700] sm:text-sm">
                      {formatLongDate(schedule.request.rescheduleFromDate)} ·{' '}
                      {formatTime(schedule.request.rescheduleFromTime ?? '')} WIB
                    </span>
                  </div>
                ) : null}
                {schedule.pending && schedule.request ? (
                  <div className="flex flex-col gap-0.5 pt-3">
                    <span className="text-[11px] font-medium text-stone-500">Diajukan Pada</span>
                    <span className="text-xs font-bold text-[#181700] sm:text-sm">
                      {formatDateTimeWithTime(schedule.request.createdAt)}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-2 border-t border-stone-100 bg-[#FAFAF8] p-4 sm:flex-row sm:items-center sm:justify-between">
            {pendingRequest ? (
              <button
                type="button"
                onClick={handleCancelPendingRequest}
                disabled={cancelPending}
                className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full border border-red-200 bg-white px-4 text-xs font-bold text-red-700 transition-colors hover:bg-red-50 focus-visible:border-[#181700] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-org-200)]/35 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cancelPending ? 'Membatalkan...' : 'Batalkan Pengajuan'}
              </button>
            ) : (
              <span className="hidden sm:block" />
            )}
            <button
              type="button"
              onClick={() => setDetailOpen(false)}
              className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full border border-stone-200 bg-white px-4 text-xs font-semibold text-[#181700] transition-colors hover:bg-stone-100 focus-visible:border-[#181700] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-org-200)]/35"
            >
              Tutup
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
