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
  Stethoscope,
} from 'lucide-react';
import { GlobalModal } from '@/components/ui/global-modal';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CountUp } from '@/components/ui/count-up';
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

  /** Metrik evaluasi terakhir + status optimal (ambang klinis sama dengan halaman rekam medis). */
  const evaluationMetrics = latestRecord
    ? [
        { key: 'pain', label: 'Nyeri', value: latestRecord.painScore, optimal: latestRecord.painScore <= 3 },
        { key: 'rom', label: 'ROM', value: latestRecord.rangeOfMotionScore, optimal: latestRecord.rangeOfMotionScore >= 8 },
        {
          key: 'strength',
          label: 'Kekuatan',
          value: latestRecord.strengthScore,
          optimal: latestRecord.strengthScore >= 8,
        },
        {
          key: 'function',
          label: 'Fungsi',
          value: latestRecord.functionScore,
          optimal: latestRecord.functionScore >= 8,
        },
      ]
    : [];
  const optimalCount = evaluationMetrics.filter((metric) => metric.optimal).length;
  const subOptimalCount = evaluationMetrics.length - optimalCount;

  /**
   * Bar distribusi memakai gradasi halus: intensitas naik bertahap menurut
   * urutan (color-mix oklab) + gradient vertikal lembut, sehingga tidak ada
   * lompatan warna antar bar.
   */
  function metricBarStyle(optimal: boolean, index: number, total: number) {
    const base = optimal ? 'var(--hafta-grn-500)' : 'var(--hafta-red-500)';
    const ratio = total > 1 ? index / (total - 1) : 0;
    const strength = Math.round(26 + ratio * 54); // 26% → 80%
    return {
      backgroundColor: `color-mix(in oklab, ${base} ${strength}%, white)`,
      backgroundImage: `linear-gradient(180deg, color-mix(in oklab, ${base} ${Math.max(
        18,
        strength - 14,
      )}%, white) 0%, color-mix(in oklab, ${base} ${Math.min(92, strength + 16)}%, white) 100%)`,
    } as const;
  }

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

      {/* ── 2. DUA KOLOM: kiri pemilihan jadwal (lebar), kanan metrik (ramping) ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start lg:gap-6">
        <div className="min-w-0 space-y-5 lg:col-span-8">
      {/* ── 3a. JADWAL TERAPI (SMART STATE) ── */}
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

        </div>

        {/* ── KOLOM KANAN (ramping): metrik perhitungan evaluasi ── */}
        <aside aria-label="Metrik evaluasi" className="min-w-0 space-y-4 lg:col-span-4">
          {/* kartu overview bergaya bar distribusi */}
          <section className={cnCard('p-4 sm:p-5')}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Overview
                </p>
                <p className="mt-1 flex items-baseline gap-1.5 text-3xl font-extrabold leading-none tracking-tight text-foreground">
                  {latestRecord ? (
                    <>
                      <span className="inline-flex items-baseline">
                        <CountUp value={optimalCount} />
                        <span className="text-xl font-bold text-muted-foreground">/{evaluationMetrics.length}</span>
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Hasil
                      </span>
                    </>
                  ) : (
                    '—'
                  )}
                </p>
              </div>
            </div>

            {/* bar distribusi metrik — hijau = optimal, merah = sub optimal */}
            <div className="mt-4 flex h-20 items-stretch gap-1.5" role="img" aria-label="Distribusi hasil evaluasi metrik">
              {evaluationMetrics.length > 0
                ? evaluationMetrics.map((metric, index) => (
                    <span
                      key={metric.key}
                      title={`${metric.label} · ${metric.optimal ? 'Optimal' : 'Sub optimal'}`}
                      className="flex-1 rounded-md transition-colors"
                      style={metricBarStyle(metric.optimal, index, evaluationMetrics.length)}
                    />
                  ))
                : [0, 1, 2, 3].map((item) => (
                    <span key={item} className="flex-1 rounded-md bg-stone-200/60" />
                  ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <span aria-hidden="true" className="block h-0.5 w-full rounded-full bg-[var(--hafta-grn-500)]" />
                <p className="mt-1.5 text-[11px] font-semibold text-muted-foreground">
                  Optimal <span className="tabular-nums text-foreground">{latestRecord ? optimalCount : '—'}</span>
                </p>
              </div>
              <div>
                <span aria-hidden="true" className="block h-0.5 w-full rounded-full bg-[var(--hafta-red-400)]" />
                <p className="mt-1.5 text-[11px] font-semibold text-muted-foreground">
                  Sub Optimal <span className="tabular-nums text-foreground">{latestRecord ? subOptimalCount : '—'}</span>
                </p>
              </div>
            </div>
          </section>

          {/* rincian nilai per metrik */}
          <section className={cnCard('p-4 sm:p-5')}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Metrik Terakhir
              </p>
              <span className="shrink-0 rounded-full bg-[var(--hafta-50)] px-2 py-0.5 text-[9px] font-semibold text-[var(--hafta-700)]">
                {latestRecord ? formatLongDate(latestRecord.recordedAt) : 'Belum ada'}
              </span>
            </div>
            <dl className="mt-3 space-y-3">
              {evaluationMetrics.length > 0
                ? evaluationMetrics.map((metric) => (
                    <div key={metric.key}>
                      <div className="flex items-baseline justify-between gap-2">
                        <dt className="text-xs font-medium text-muted-foreground">{metric.label}</dt>
                        <dd
                          className={cn(
                            'text-sm font-bold tabular-nums',
                            metric.optimal ? 'text-[var(--hafta-grn-700)]' : 'text-[var(--hafta-red-700)]',
                          )}
                        >
                          <CountUp value={metric.value} />
                          <span className="text-[9px] font-medium text-muted-foreground">/10</span>
                        </dd>
                      </div>
                      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-stone-200/70">
                        <span
                          className={cn(
                            'block h-full rounded-full',
                            metric.optimal ? 'bg-[var(--hafta-grn-500)]' : 'bg-[var(--hafta-red-400)]',
                          )}
                          style={{ width: `${Math.max(4, metric.value * 10)}%` }}
                        />
                      </div>
                    </div>
                  ))
                : (
                    <p className="border-y border-border/70 py-4 text-xs leading-relaxed text-muted-foreground">
                      Metrik evaluasi akan tampil setelah fisioterapis menyelesaikan sesi pertama.
                    </p>
                  )}
            </dl>
          </section>
        </aside>

      </div>{/* end grid 12 kolom */}

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
