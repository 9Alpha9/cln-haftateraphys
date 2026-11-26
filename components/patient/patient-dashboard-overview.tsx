'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Dumbbell,
  FileText,
  History,
  LockKeyhole,
  Printer,
  Stethoscope,
  TrendingUp,
} from 'lucide-react';
import { GlobalModal } from '@/components/ui/global-modal';
import { Button } from '@/components/ui/button';
import { CountUp } from '@/components/ui/count-up';
import { MedicalRecordPrintDialog } from '@/components/pdf/medical-record-print-dialog';
import { PatientBookingPanel } from '@/components/patient/patient-booking-panel';
import { useToast } from '@/components/ui/toast';
import { cancelPatientAppointmentRequest } from '@/server/actions/appointment-requests';
import type { HomeProgramView } from '@/server/queries/home-programs';
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
  homeProgram,
}: {
  userName?: string | null;
  appointments: PatientPortalAppointment[];
  requests: PatientAppointmentRequestView[];
  availability: AvailabilityDate[];
  records: TherapyProgressView[];
  homeProgram: HomeProgramView | null;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
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
  /** Progres ringkas dari evaluasi terakhir: rata-rata ROM, kekuatan, fungsi (0–100%). */
  const progressPercent = latestRecord
    ? Math.round(
        ((latestRecord.rangeOfMotionScore + latestRecord.strengthScore + latestRecord.functionScore) / 30) * 100,
      )
    : 0;
  const activeProgramItems = homeProgram?.items.filter((item) => item.status === 'ACTIVE') ?? [];

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

      {/* ── 2. RINGKASAN CEPAT — 3 kartu status ── */}
      <section aria-label="Ringkasan cepat" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <article className={cnCard('p-4')}>
          <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <Clock3 className="h-3 w-3" />
            Sesi Berikutnya
          </p>
          <p className="mt-1.5 text-lg font-extrabold leading-tight tracking-tight text-foreground">
            {schedule ? formatLongDate(schedule.date) : 'Belum dijadwalkan'}
          </p>
          <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
            {schedule
              ? `${formatTime(schedule.startTime)} WIB · ${schedule.therapistName}`
              : 'Ajukan jadwal terapi bersama fisioterapis Anda.'}
          </p>
        </article>

        <article className={cnCard('p-4')}>
          <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            Progres Terakhir
          </p>
          <p className="mt-1.5 text-lg font-extrabold leading-tight tracking-tight text-foreground">
            {latestRecord ? (
              <>
                <CountUp value={progressPercent} />
                <span className="text-sm font-bold text-muted-foreground">%</span>
              </>
            ) : (
              '—'
            )}
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-stone-200/70">
            <span
              className="block h-full rounded-full bg-[var(--hafta-grn-500)] transition-[width] duration-700"
              style={{ width: `${latestRecord ? Math.max(4, progressPercent) : 0}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
            {latestRecord ? 'Rata-rata ROM, kekuatan & fungsi' : 'Belum ada evaluasi tercatat.'}
          </p>
        </article>

        <article className={cnCard('p-4')}>
          <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <ClipboardList className="h-3 w-3" />
            Rekam Medis
          </p>
          <p className="mt-1.5 text-lg font-extrabold leading-tight tracking-tight text-foreground">
            {records.length > 0 ? (
              <>
                <CountUp value={records.length} /> <span className="text-sm font-bold text-muted-foreground">berkas</span>
              </>
            ) : (
              '—'
            )}
          </p>
          <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
            {latestRecord
              ? `Terakhir ${formatLongDate(latestRecord.recordedAt)}`
              : 'Catatan evaluasi akan muncul setelah sesi terapi.'}
          </p>
        </article>
      </section>

      {/* ── 3. KONTEN UTAMA: kiri jadwal + rekam medis, kanan latihan & akses cepat ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start lg:gap-6">
        <div className="min-w-0 space-y-5 lg:col-span-7">
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

      {/* ── 3. REKAM MEDIS — preview ringkas terakhir ── */}
      <section aria-label="Rekam medis dan evaluasi terapi" className={cnCard('p-4 sm:p-5')}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <ClipboardList className="h-3 w-3" />
              Rekam Medis
            </p>
            <h2 className="mt-1 text-base font-bold text-foreground">Evaluasi Terapi Terakhir</h2>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Link
              href="/dashboard/progress"
              className="hidden w-fit items-center gap-1 rounded text-xs font-semibold text-foreground underline-offset-4 hover:underline focus-visible:border-[var(--hafta-950)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35 sm:inline-flex"
            >
              Lihat Semua
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
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
                <div key={metric.label} className="hafta-tint px-2.5 py-2 text-center">
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
              <button
                type="button"
                onClick={() => setPrintOpen(true)}
                className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-background px-4 text-xs font-semibold text-foreground transition-colors hover:bg-accent focus-visible:border-[var(--hafta-950)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
              >
                <Printer className="h-3.5 w-3.5" />
                Cetak Rekam Medis
              </button>
            </div>
          </div>
        ) : null}

        {records.length > 1 ? (
          <p className="mt-3 flex items-center gap-1.5 border-t border-border/70 pt-3 text-[10.5px] text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            {records.length} rekam medis tersimpan
          </p>
        ) : null}

        <Link
          href="/dashboard/progress"
          className="mt-3 flex h-11 w-full items-center justify-center gap-1.5 rounded-full border border-border bg-card text-xs font-semibold text-foreground transition-colors hover:bg-accent focus-visible:border-[var(--hafta-950)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35 sm:hidden"
        >
          Lihat Semua Rekam Medis
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </section>

        </div>

        {/* ── KOLOM KANAN: latihan mandiri + akses cepat ── */}
        <aside aria-label="Latihan mandiri dan akses cepat" className="min-w-0 space-y-5 lg:col-span-5">
          <section className={cnCard('p-4 sm:p-5')}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  <Dumbbell className="h-3 w-3" />
                  Latihan Mandiri
                </p>
                <h2 className="mt-1 text-base font-bold text-foreground">Program dari Terapis</h2>
              </div>
              <Link
                href="/dashboard/exercises"
                className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full border border-border bg-card px-3 text-[11px] font-semibold text-foreground transition-colors hover:bg-accent"
              >
                Semua
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {activeProgramItems.length === 0 ? (
              <p className="mt-3 border-y border-border/70 py-4 text-xs leading-relaxed text-muted-foreground">
                Belum ada program latihan aktif. Fisioterapis akan menambahkan latihan mandiri setelah
                evaluasi.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {activeProgramItems.slice(0, 3).map((item) => (
                  <li key={item.id} className="hafta-tint px-3 py-2.5">
                    <p className="text-[13px] font-bold text-foreground">{item.name}</p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                      {[
                        item.sets ? `${item.sets} set` : null,
                        item.repetitions ? `${item.repetitions} repetisi` : null,
                        item.frequencyText,
                      ]
                        .filter(Boolean)
                        .join(' · ') || item.instruction}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-3 flex items-center gap-1.5 border-t border-border/70 pt-3 text-[10.5px] text-muted-foreground">
              <Dumbbell className="h-3 w-3" />
              {activeProgramItems.length} latihan aktif
            </p>
          </section>

          <section className={cnCard('p-4 sm:p-5')}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Akses Cepat
            </p>
            <h2 className="mt-1 text-base font-bold text-foreground">Menu Pasien</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                { href: '/dashboard/progress', label: 'Rekam Medis', icon: ClipboardList },
                { href: '/dashboard/exercises', label: 'Latihan Saya', icon: Dumbbell },
                { href: '/dashboard/documents', label: 'Dokumen', icon: FileText },
                { href: '/dashboard/history', label: 'Riwayat', icon: History },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex min-h-11 items-center gap-2 rounded-2xl border border-border bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--hafta-50)] text-[var(--hafta-700)]">
                    <item.icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
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

      <MedicalRecordPrintDialog
        record={latestRecord}
        open={printOpen}
        onOpenChange={setPrintOpen}
      />
    </div>
  );
}

function cnCard(extra: string) {
  return `${CARD} ${extra}`;
}
