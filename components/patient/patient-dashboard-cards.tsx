'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarClock, ChevronDown, FileHeart, ShieldCheck, TrendingUp, X } from 'lucide-react';
import type {
  PatientAppointmentRequestView,
  PatientPortalAppointment,
} from '@/server/queries/patient-portal';
import type { TherapyProgressView } from '@/server/queries/therapy-progress';

const TYPE_LABELS: Record<string, string> = {
  INITIAL_ASSESSMENT: 'Assessment Awal',
  THERAPY_SESSION: 'Sesi Terapi',
  FOLLOW_UP: 'Tindak Lanjut',
  EVALUATION: 'Evaluasi',
};

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Terjadwal',
  CONFIRMED: 'Terkonfirmasi',
  IN_PROGRESS: 'Sedang berjalan',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
  RESCHEDULED: 'Dijadwalkan ulang',
  NO_SHOW: 'Tidak hadir',
};

function toDateKey(value: Date | string) {
  if (typeof value === 'string') return value.slice(0, 10);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(
    value.getDate(),
  ).padStart(2, '0')}`;
}

function formatShortDate(value: Date | string) {
  const date = typeof value === 'string' ? new Date(`${value.slice(0, 10)}T00:00:00`) : value;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
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

function formatTimeLabel(value: string) {
  return value.slice(0, 5);
}

export function PatientProgressPanel({
  appointments,
  requests,
  records,
  totalRecords,
  treatmentGoal,
}: {
  appointments: PatientPortalAppointment[];
  requests: PatientAppointmentRequestView[];
  records: TherapyProgressView[];
  totalRecords: number;
  treatmentGoal: string | null;
}) {
  const todayKey = toDateKey(new Date());
  const [selectedSession, setSelectedSession] = useState<PatientPortalAppointment | null>(null);

  useEffect(() => {
    if (!selectedSession) return;
    const html = document.documentElement;
    const body = document.body;
    const previousHtml = html.style.overflow;
    const previousBody = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = previousHtml;
      body.style.overflow = previousBody;
    };
  }, [selectedSession]);
  const completed = appointments.filter((a) => a.status === 'COMPLETED').length;
  const noShow = appointments.filter((a) => a.status === 'NO_SHOW').length;
  const scheduled = appointments.filter(
    (a) => ['SCHEDULED', 'CONFIRMED'].includes(a.status) && toDateKey(a.scheduledDate) >= todayKey,
  ).length;
  const pending = requests.filter((r) => r.status === 'PENDING').length;
  const eligible = completed + noShow;
  const attendance = eligible ? Math.round((completed / eligible) * 100) : null;

  const recentSessions = appointments
    .filter((a) => toDateKey(a.scheduledDate) <= todayKey)
    .sort((a, b) =>
      `${toDateKey(b.scheduledDate)}${b.startTime}`.localeCompare(
        `${toDateKey(a.scheduledDate)}${a.startTime}`,
      ),
    )
    .slice(0, 6)
    .reverse();

  const latest = records[0] ?? null;

  return (
    <section className="space-y-4 rounded-3xl border border-stone-200/90 bg-white p-3.5 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
            Progres Terapi
          </p>
          <h2 className="mt-1 text-base font-bold text-[#181700]">Perjalanan Anda</h2>
        </div>
        <TrendingUp className="h-4 w-4 shrink-0 text-stone-400" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Sesi selesai', value: completed },
          { label: 'Terjadwal', value: scheduled },
          { label: 'Kehadiran', value: attendance === null ? '—' : `${attendance}%` },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl bg-[#FAFAF8] px-3 py-2.5">
            <p className="text-lg font-extrabold leading-none text-[#181700]">{item.value}</p>
            <p className="mt-1 text-[10px] leading-tight text-stone-500">{item.label}</p>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-[#181700]">Sesi terakhir</p>
          <span className="text-[10px] text-stone-400">6 sesi terakhir</span>
        </div>
        {recentSessions.length === 0 ? (
          <p className="mt-2 rounded-2xl bg-[#FAFAF8] px-3 py-4 text-center text-[11px] text-stone-500">
            Belum ada sesi yang tercatat.
          </p>
        ) : (
          <>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {recentSessions.map((session) => {
                const styles =
                  session.status === 'COMPLETED'
                    ? 'bg-[#181700] text-[var(--hafta-ylw-100)] border-[#181700]'
                    : session.status === 'NO_SHOW'
                      ? 'border-[var(--hafta-red-300)] bg-[var(--hafta-red-50)] text-[var(--hafta-red-700)]'
                      : session.status === 'CANCELLED'
                        ? 'border-stone-200 bg-white text-stone-400'
                        : 'border-[var(--hafta-ylw-200)] bg-[var(--hafta-ylw-50)]/60 text-[#181700]';
                const day = new Date(`${toDateKey(session.scheduledDate)}T00:00:00`).getDate();
                return (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => setSelectedSession(session)}
                    title={`${formatShortDate(session.scheduledDate)} · ${
                      STATUS_LABELS[session.status] ?? session.status
                    }`}
                    aria-label={`Detail sesi ${formatShortDate(session.scheduledDate)}`}
                    className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border text-[11px] font-bold transition-transform hover:scale-105 ${styles}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            <ul className="mt-2.5 space-y-1">
              {recentSessions
                .slice(-3)
                .reverse()
                .map((session) => (
                  <li
                    key={session.id}
                    className="flex items-center justify-between gap-2 text-[11px]"
                  >
                    <span className="text-stone-600">
                      {formatShortDate(session.scheduledDate)} · {session.startTime}
                    </span>
                    <span className="font-semibold text-[#181700]">
                      {STATUS_LABELS[session.status] ?? session.status}
                    </span>
                  </li>
                ))}
            </ul>
          </>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-stone-500">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#181700]" /> Selesai
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[var(--hafta-red-400)]" /> Tidak hadir
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full border border-[var(--hafta-ylw-300)] bg-[var(--hafta-ylw-50)]" />{' '}
            Terjadwal
          </span>
        </div>
      </div>

      {latest ? (
        <div className="rounded-2xl border border-stone-200/80 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-[#181700]">Skor terakhir</p>
            <span className="text-[10px] text-stone-400">{formatShortDate(latest.recordedAt)}</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {[
              { label: 'Nyeri', value: latest.painScore },
              { label: 'Fungsi', value: latest.functionScore },
            ].map((metric) => (
              <div key={metric.label}>
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] text-stone-500">{metric.label}</span>
                  <span className="text-sm font-bold text-[#181700]">{metric.value}/10</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-stone-100">
                  <div
                    className="h-full rounded-full bg-[#181700]"
                    style={{ width: `${Math.min(100, Math.max(0, (metric.value / 10) * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-stone-500">
            Skor diisi fisioterapis saat sesi, bukan penilaian mandiri.
          </p>
        </div>
      ) : null}

      <div className="rounded-2xl bg-[#FAFAF8] p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">
          Target terapi
        </p>
        <p className="mt-1 text-xs leading-relaxed text-stone-700">
          {treatmentGoal ?? 'Target terapi akan tampil setelah asesmen awal selesai.'}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-stone-100 pt-3 text-[11px] text-stone-500">
        <span className="inline-flex items-center gap-1.5">
          <CalendarClock className="h-3.5 w-3.5" />
          {pending} pengajuan menunggu
        </span>
        <span className="inline-flex items-center gap-1.5">
          <FileHeart className="h-3.5 w-3.5" />
          {totalRecords} catatan
        </span>
      </div>

      {selectedSession ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Tutup detail sesi"
            onClick={() => setSelectedSession(null)}
            className="absolute inset-0 cursor-pointer bg-black/50 backdrop-blur-sm"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Detail sesi"
            className="relative max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-3xl border border-stone-200/70 bg-white p-4 shadow-[0_18px_50px_rgba(24,23,0,0.18)] sm:p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">
                  Detail sesi
                </p>
                <p className="mt-1 text-base font-bold text-[#181700]">
                  {formatLongDate(selectedSession.scheduledDate)}
                </p>
              </div>
              <button
                type="button"
                aria-label="Tutup"
                onClick={() => setSelectedSession(null)}
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-stone-200 text-stone-500 hover:bg-stone-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <dl className="mt-3 space-y-2.5 rounded-2xl bg-[#FBFBFA] p-3 text-xs">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-stone-500">Waktu</dt>
                <dd className="font-semibold text-[#181700]">
                  {selectedSession.startTime} · {selectedSession.durationMinutes} menit
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-stone-500">Jenis sesi</dt>
                <dd className="font-semibold text-[#181700]">
                  {TYPE_LABELS[selectedSession.type] ?? selectedSession.type}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-stone-500">Fisioterapis</dt>
                <dd className="font-semibold text-[#181700]">
                  {selectedSession.therapistName ?? 'Fisioterapis Hafta'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-stone-500">Status</dt>
                <dd className="font-semibold text-[#181700]">
                  {STATUS_LABELS[selectedSession.status] ?? selectedSession.status}
                </dd>
              </div>
            </dl>
            <Link
              href="/dashboard/progress"
              className="mt-4 flex h-10 w-full items-center justify-center rounded-full bg-[var(--hafta-ylw-100)] text-xs font-bold text-[#181700] shadow-2xs transition-colors hover:bg-[var(--hafta-ylw-200)]"
            >
              Lihat rekam medis
            </Link>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function PatientHelpCard() {
  return (
    <section className="rounded-3xl border border-[var(--hafta-ylw-200)] bg-[var(--hafta-ylw-50)]/45 p-3.5 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#181700] shadow-2xs">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-sm font-bold text-[#181700]">Butuh bantuan?</h2>
          <p className="mt-1 text-xs leading-relaxed text-stone-600">
            Jadwal terapi bisa dibuat langsung dari dashboard. Untuk pertanyaan tentang program
            terapi atau kendala akun, hubungi tim Hafta.
          </p>
          <Link
            href="/kontak"
            className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-full bg-[#181700] px-4 text-xs font-bold text-white transition-colors hover:bg-[var(--hafta-ylw-100)] hover:text-[#181700]"
          >
            Hubungi tim Hafta
          </Link>
        </div>
      </div>
    </section>
  );
}

export function PatientNextSessionCard({
  upcoming,
  pendingRequest,
  onOpenStatus,
}: {
  upcoming: PatientPortalAppointment | null;
  pendingRequest: PatientAppointmentRequestView | null;
  onOpenStatus: () => void;
}) {
  const title = pendingRequest
    ? 'Pengajuan jadwal'
    : upcoming
      ? 'Sesi berikutnya'
      : 'Belum ada jadwal';

  return (
    <article className="flex min-w-[250px] snap-start flex-col justify-between rounded-3xl border border-[var(--hafta-ylw-200)] bg-[var(--hafta-ylw-100)] p-3.5 text-[#181700] lg:min-w-0">
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#181700]/70">
          {title}
        </p>
        {pendingRequest ? (
          <>
            <h3 className="mt-2 text-lg font-extrabold leading-tight">
              {formatShortDate(pendingRequest.requestedDate)} · {formatTimeLabel(pendingRequest.startTime)}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-[#181700]/80">
              {pendingRequest.rescheduleFromDate
                ? `Menggantikan ${formatShortDate(pendingRequest.rescheduleFromDate)} · ${formatTimeLabel(pendingRequest.rescheduleFromTime ?? '')}`
                : 'Pengajuan jadwal terapi'}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[#181700]/80">
              {pendingRequest.therapistName ?? 'Fisioterapis Hafta'}
            </p>
          </>
        ) : upcoming ? (
          <>
            <h3 className="mt-2 text-lg font-extrabold leading-tight">
              {formatShortDate(upcoming.scheduledDate)} · {formatTimeLabel(upcoming.startTime)}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-[#181700]/80">
              {upcoming.durationMinutes} menit · {upcoming.therapistName ?? 'Fisioterapis Hafta'}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[#181700]/80">
              {STATUS_LABELS[upcoming.status] ?? upcoming.status}
            </p>
          </>
        ) : (
          <p className="mt-2 text-xs leading-relaxed text-[#181700]/80">
            Pilih tanggal dan jam yang tersedia untuk memulai sesi terapi Anda.
          </p>
        )}
      </div>
      {pendingRequest ? (
        <button
          type="button"
          onClick={onOpenStatus}
          className="mt-4 inline-flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[#181700]/15 bg-white/80 text-xs font-bold transition-colors hover:bg-white"
        >
          Lihat status pengajuan
        </button>
      ) : (
        <Link
          href={upcoming ? '/dashboard/appointments' : '#buat-jadwal'}
          className="mt-4 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full border border-[#181700]/15 bg-white/80 text-xs font-bold transition-colors hover:bg-white"
        >
          {upcoming ? 'Lihat jadwal' : 'Ajukan jadwal'}
        </Link>
      )}
    </article>
  );
}

export function PatientIntakeCard({
  badge,
  title,
  action,
  needsAttention,
}: {
  badge: string;
  title: string;
  action: string;
  needsAttention: boolean;
}) {
  return (
    <article className="flex min-w-[230px] snap-start flex-col justify-between rounded-3xl border border-stone-200/90 bg-white p-3.5 lg:min-w-0">
      <div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">
            Form Awal
          </p>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              needsAttention
                ? 'bg-[var(--hafta-red-50)] text-[var(--hafta-red-700)]'
                : 'bg-[var(--hafta-grn-50)] text-[var(--hafta-grn-700)]'
            }`}
          >
            {badge}
          </span>
        </div>
        <h3 className="mt-2 text-sm font-bold leading-snug text-[#181700]">{title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-stone-500">
          {needsAttention
            ? 'Lengkapi agar fisioterapis dapat menyiapkan asesmen yang sesuai.'
            : 'Data awal Anda sudah tercatat.'}
        </p>
      </div>
      <Link
        href="/dashboard/intake"
        className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-[#F4F4F1] px-4 text-xs font-bold text-[#181700] transition-colors hover:bg-[var(--hafta-ylw-100)]"
      >
        {action}
      </Link>
    </article>
  );
}

export function PatientProgressCard({
  completed,
  scheduled,
}: {
  completed: number;
  scheduled: number;
}) {
  const total = completed + scheduled;
  const ratio = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <article className="flex min-w-[220px] snap-start flex-col justify-between rounded-3xl border border-stone-200/90 bg-white p-3.5 lg:min-w-0">
      <div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">
            Progres Terapi
          </p>
          <TrendingUp className="h-3.5 w-3.5 text-stone-400" />
        </div>
        <p className="mt-2 text-2xl font-extrabold leading-none text-[#181700]">
          {completed}
          <span className="ml-1 text-xs font-semibold text-stone-400">sesi selesai</span>
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-100">
          <div className="h-full rounded-full bg-[#181700]" style={{ width: `${ratio}%` }} />
        </div>
        <p className="mt-1.5 text-[10px] text-stone-500">
          {scheduled > 0 ? `${scheduled} sesi terjadwal berikutnya` : 'Belum ada sesi terjadwal'}
        </p>
      </div>
      <Link
        href="/dashboard/progress"
        className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-[#F4F4F1] px-4 text-xs font-bold text-[#181700] transition-colors hover:bg-[var(--hafta-ylw-100)]"
      >
        Lihat progres
      </Link>
    </article>
  );
}

export function PatientTodayCard({
  items,
  done,
}: {
  items: { label: string; hint: string; state: 'done' | 'pending' | 'waiting' | 'empty' }[];
  done: number;
}) {
  return (
    <article className="flex min-w-[250px] snap-start flex-col rounded-3xl border border-stone-200/90 bg-white p-3.5 lg:min-w-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">
          Hari ini
        </p>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-stone-500">
          {done} dari {items.length} selesai
          {items.length > 4 ? (
            <span className="inline-flex items-center gap-0.5 text-stone-400" aria-hidden="true">
              <ChevronDown className="h-3 w-3" />
              geser
            </span>
          ) : null}
        </span>
      </div>
      <div className="relative mt-2.5">
        <ul
          aria-label="Aktivitas hari ini"
          tabIndex={items.length > 4 ? 0 : -1}
          className="max-h-[208px] space-y-1.5 overflow-y-auto overscroll-contain pr-1 outline-none focus-visible:ring-2 focus-visible:ring-[#181700]/20 [scrollbar-color:var(--color-stone-300)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-stone-300 [&::-webkit-scrollbar-track]:bg-transparent"
        >
          {items.map((item) => (
            <li key={item.label} className="flex items-start gap-2 rounded-2xl bg-[#FAFAF8] px-2.5 py-2">
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold ${
                  item.state === 'done'
                    ? 'border-[var(--hafta-grn-500)] bg-[var(--hafta-grn-50)] text-[var(--hafta-grn-700)]'
                    : item.state === 'waiting'
                      ? 'border-[var(--hafta-ylw-300)] bg-[var(--hafta-ylw-50)] text-[#181700]'
                      : item.state === 'empty'
                        ? 'border-stone-200 bg-white text-stone-300'
                        : 'border-stone-300 bg-white text-stone-400'
                }`}
              >
                {item.state === 'done' ? '✓' : item.state === 'waiting' ? '…' : ''}
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] font-semibold leading-tight text-[#181700]">
                  {item.label}
                </span>
                <span className="mt-0.5 block text-[10px] leading-tight text-stone-500">
                  {item.hint}
                </span>
              </span>
            </li>
          ))}
        </ul>
        {items.length > 4 ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-7 bg-gradient-to-t from-white to-transparent"
          />
        ) : null}
      </div>
    </article>
  );
}
