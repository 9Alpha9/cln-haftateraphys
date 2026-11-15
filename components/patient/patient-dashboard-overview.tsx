'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  Printer,
  Stethoscope,
  TrendingUp,
} from 'lucide-react';
import { GlobalModal } from '@/components/ui/global-modal';
import { Button } from '@/components/ui/button';
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

const CARD = 'hafta-card';

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

  const latestRecord = records[0] ?? null;

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
    <div className="w-full space-y-5 pb-8 sm:space-y-6">
      {/* ── 1. HEADER SAPAAN — flat, tanpa kartu ── */}
      <header className="pt-3 sm:pt-4">
        <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          <CalendarDays className="h-3 w-3" />
          {formatLongDate(today)}
        </p>
        <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Halo, {userName?.split(' ')[0] || 'Pasien'}
        </h1>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
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
          <article className={cnCard('p-4 sm:p-5')}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Jadwal Terapi Anda
                </p>
                <h2 className="mt-0.5 text-base font-bold text-foreground">
                  {schedule.pending ? 'Pengajuan Jadwal Terapi' : 'Sesi Terapi Terjadwal'}
                </h2>
              </div>
              {schedule.pending ? (
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--hafta-50)] px-2.5 py-1 text-[10px] font-semibold text-[var(--hafta-700)]">
                  <Clock3 className="h-3 w-3" />
                  Menunggu Konfirmasi Terapis
                </span>
              ) : (
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--hafta-grn-50)] px-2.5 py-1 text-[10px] font-semibold text-[var(--hafta-grn-700)]">
                  <CheckCircle2 className="h-3 w-3" />
                  Terjadwal Resmi
                </span>
              )}
            </div>

            <dl className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
              {[
                { icon: Stethoscope, label: 'Fisioterapis', value: schedule.therapistName },
                { icon: CalendarDays, label: 'Hari & Tanggal', value: formatLongDate(schedule.date) },
                {
                  icon: Clock3,
                  label: 'Jam & Durasi',
                  value: `${formatTime(schedule.startTime)} WIB · ${schedule.durationMinutes} menit`,
                },
              ].map((item) => (
                <div key={item.label} className="hafta-tint px-3 py-2.5">
                  <dt className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    <item.icon className="h-3 w-3" />
                    {item.label}
                  </dt>
                  <dd className="mt-1 truncate text-[13px] font-bold text-foreground">{item.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-4 flex flex-col gap-2.5 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1.5">
                <Button
                  type="button"
                  disabled={schedule.pending}
                  onClick={() => setIsRescheduling(true)}
                  className="w-full sm:w-auto"
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
                </Button>
                {schedule.pending ? (
                  <p className="text-[10px] leading-relaxed text-muted-foreground">
                    Perubahan jadwal dapat dilakukan setelah terapis mengonfirmasi pengajuan ini.
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDetailOpen(true)}
                className="w-full sm:w-auto"
              >
                Lihat Detail
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </article>
        ) : null}
      </section>

      {/* ── 3. REKAM MEDIS — preview ringkas terakhir ── */}
      <section aria-label="Rekam medis dan evaluasi terapi" className={cnCard('p-4 sm:p-5')}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Rekam Medis
            </p>
            <h2 className="mt-0.5 text-base font-bold text-foreground">Evaluasi Terapi Terakhir</h2>
          </div>
          <Link
            href="/dashboard/progress"
            className="inline-flex w-fit items-center gap-1 rounded text-xs font-semibold text-foreground underline-offset-4 hover:underline focus-visible:border-[var(--hafta-950)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
          >
            Lihat Semua
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {records.length === 0 ? (
          <p className="mt-4 border-y border-border/70 py-4 text-xs leading-relaxed text-muted-foreground">
            Belum ada rekam medis. Catatan evaluasi dari fisioterapis akan muncul di sini setelah
            sesi terapi selesai.
          </p>
        ) : latestRecord ? (
          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[12.5px] font-semibold text-foreground">
                {formatLongDate(latestRecord.recordedAt)}
              </p>
              <span
                className={
                  latestRecord.status === 'FINALIZED'
                    ? 'rounded-full bg-[var(--hafta-grn-50)] px-2 py-0.5 text-[10px] font-semibold text-[var(--hafta-grn-700)]'
                    : 'rounded-full bg-secondary/60 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground'
                }
              >
                {latestRecord.status === 'FINALIZED' ? 'Final' : 'Draf'}
              </span>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Stethoscope className="h-3 w-3 shrink-0" />
              {latestRecord.therapistName ?? 'Fisioterapis Hafta'}
            </p>
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {latestRecord.diagnosis || latestRecord.summary || 'Belum dicatat'}
            </p>

            <dl className="mt-3 grid grid-cols-4 gap-2">
              {[
                { label: 'Nyeri', value: latestRecord.painScore },
                { label: 'ROM', value: latestRecord.rangeOfMotionScore },
                { label: 'Kekuatan', value: latestRecord.strengthScore },
                { label: 'Fungsi', value: latestRecord.functionScore },
              ].map((metric) => (
                <div key={metric.label} className="hafta-tint px-2.5 py-2">
                  <dt className="text-[9.5px] font-medium uppercase tracking-wide text-muted-foreground">
                    {metric.label}
                  </dt>
                  <dd className="mt-0.5 text-sm font-extrabold tabular-nums text-foreground">
                    {metric.value}
                    <span className="text-[9.5px] font-medium text-muted-foreground">/10</span>
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-3 flex justify-end">
              <Link
                href={`/dashboard/progress/${latestRecord.id}/print`}
                className="inline-flex h-11 items-center gap-1.5 rounded-full border border-border bg-background px-4 text-xs font-semibold text-foreground transition-colors hover:bg-accent focus-visible:border-[var(--hafta-950)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
              >
                <Printer className="h-3.5 w-3.5" />
                Detail / Cetak
              </Link>
            </div>
          </div>
        ) : null}

        {records.length > 1 ? (
          <p className="mt-3 flex items-center gap-1.5 border-t border-border/70 pt-3 text-[10.5px] text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            {records.length} rekam medis tersimpan
          </p>
        ) : null}
      </section>

      {/* ── MODAL GLOBAL: detail jadwal ── */}
      <GlobalModal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        icon={<CalendarDays className="h-4 w-4" />}
        title="Detail Jadwal Terapi"
        subtitle="Rincian jadwal dan status pengajuan terapi Anda."
        badge={
          schedule?.pending ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--hafta-50)] px-2 py-0.5 text-[10px] font-semibold text-[var(--hafta-700)]">
              <Clock3 className="h-3 w-3" />
              Menunggu Konfirmasi
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--hafta-grn-50)] px-2 py-0.5 text-[10px] font-semibold text-[var(--hafta-grn-700)]">
              <CheckCircle2 className="h-3 w-3" />
              Terjadwal Resmi
            </span>
          )
        }
        footer={
          schedule?.pending && pendingRequest ? (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancelPendingRequest}
                disabled={cancelPending}
                className="text-[var(--hafta-red-700)] hover:bg-[var(--hafta-red-50)] hover:text-[var(--hafta-red-700)]"
              >
                {cancelPending ? 'Membatalkan…' : 'Batalkan Pengajuan'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setDetailOpen(false)}>
                Tutup
              </Button>
            </>
          ) : (
            <Button type="button" variant="outline" onClick={() => setDetailOpen(false)}>
              Tutup
            </Button>
          )
        }
      >
        {schedule ? (
          <dl className="divide-y divide-border/70">
            <div className="grid gap-0.5 py-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-4">
              <dt className="text-[11px] font-medium text-muted-foreground sm:pt-px">Fisioterapis</dt>
              <dd className="text-[13px] font-semibold text-foreground">{schedule.therapistName}</dd>
            </div>
            <div className="grid gap-0.5 py-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-4">
              <dt className="text-[11px] font-medium text-muted-foreground sm:pt-px">Hari &amp; Tanggal</dt>
              <dd className="text-[13px] font-semibold text-foreground">{formatLongDate(schedule.date)}</dd>
            </div>
            <div className="grid gap-0.5 py-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-4">
              <dt className="text-[11px] font-medium text-muted-foreground sm:pt-px">Jam &amp; Durasi</dt>
              <dd className="text-[13px] font-semibold tabular-nums text-foreground">
                {formatTime(schedule.startTime)} WIB · {schedule.durationMinutes} menit
              </dd>
            </div>
            {schedule.pending && schedule.request?.rescheduleFromDate ? (
              <div className="grid gap-0.5 py-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-4">
                <dt className="text-[11px] font-medium text-muted-foreground sm:pt-px">Jadwal Semula</dt>
                <dd className="text-[13px] font-semibold tabular-nums text-foreground">
                  {formatLongDate(schedule.request.rescheduleFromDate)} ·{' '}
                  {formatTime(schedule.request.rescheduleFromTime ?? '')} WIB
                </dd>
              </div>
            ) : null}
            {schedule.pending && schedule.request ? (
              <div className="grid gap-0.5 py-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-4">
                <dt className="text-[11px] font-medium text-muted-foreground sm:pt-px">Diajukan Pada</dt>
                <dd className="text-[13px] font-semibold tabular-nums text-foreground">
                  {formatDateTimeWithTime(schedule.request.createdAt)}
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}
      </GlobalModal>
    </div>
  );
}

function cnCard(extra: string) {
  return `${CARD} ${extra}`;
}
