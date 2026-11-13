'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CalendarDays, History, Printer } from 'lucide-react';
import { PaginationBar } from '@/components/ui/pagination-bar';
import type { PatientPortalAppointment } from '@/server/queries/patient-portal';

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Terjadwal',
  CONFIRMED: 'Terkonfirmasi',
  IN_PROGRESS: 'Sedang berjalan',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
  RESCHEDULED: 'Dijadwalkan ulang',
  NO_SHOW: 'Tidak hadir',
};

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: 'border-[var(--hafta-org-200)] bg-[var(--hafta-org-50)] text-[#181700]',
  CONFIRMED: 'border-[var(--hafta-grn-200)] bg-[var(--hafta-grn-50)] text-[var(--hafta-grn-700)]',
  IN_PROGRESS: 'border-blue-200 bg-blue-50 text-blue-700',
  COMPLETED: 'border-stone-200 bg-stone-100 text-stone-700',
  CANCELLED: 'border-red-200 bg-red-50 text-red-700',
  RESCHEDULED: 'border-amber-200 bg-amber-50 text-amber-800',
  NO_SHOW: 'border-red-200 bg-red-100 text-red-800',
};

function toDateKey(value: Date | string) {
  if (typeof value === 'string') return value.slice(0, 10);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(
    value.getDate(),
  ).padStart(2, '0')}`;
}

function formatDate(value: Date | string) {
  const date = typeof value === 'string' ? new Date(`${value.slice(0, 10)}T00:00:00`) : value;
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function SessionRow({ appointment }: { appointment: PatientPortalAppointment }) {
  const canPrint = appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED';

  return (
    <li className="flex flex-col gap-2.5 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-bold text-[#181700]">{formatDate(appointment.scheduledDate)}</p>
        <p className="mt-0.5 text-xs text-stone-600">
          {appointment.startTime} · {appointment.durationMinutes} menit
        </p>
        <p className="mt-0.5 text-xs text-stone-500">
          {appointment.therapistName ?? 'Fisioterapis Hafta'}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span
          className={`inline-flex h-8 items-center rounded-full border px-3 text-[11px] font-semibold ${
            STATUS_STYLES[appointment.status] ?? 'border-stone-200 bg-stone-100 text-stone-700'
          }`}
        >
          {STATUS_LABELS[appointment.status] ?? appointment.status}
        </span>
        {canPrint ? (
          <Link
            href={`/dashboard/appointments/${appointment.id}/print`}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 text-[11px] font-semibold text-[#181700] transition-colors hover:bg-stone-50"
          >
            <Printer className="h-3.5 w-3.5" />
            Cetak
          </Link>
        ) : null}
      </div>
    </li>
  );
}

export function PatientSessionList({ appointments }: { appointments: PatientPortalAppointment[] }) {
  const todayKey = toDateKey(new Date());
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [pageSize, setPageSize] = useState(4);

  const upcoming = appointments
    .filter(
      (appointment) =>
        ['SCHEDULED', 'CONFIRMED'].includes(appointment.status) &&
        toDateKey(appointment.scheduledDate) >= todayKey,
    )
    .sort((a, b) =>
      `${toDateKey(a.scheduledDate)}${a.startTime}`.localeCompare(
        `${toDateKey(b.scheduledDate)}${b.startTime}`,
      ),
    );

  const history = appointments
    .filter(
      (appointment) =>
        !['SCHEDULED', 'CONFIRMED'].includes(appointment.status) ||
        toDateKey(appointment.scheduledDate) < todayKey,
    )
    .sort((a, b) =>
      `${toDateKey(b.scheduledDate)}${b.startTime}`.localeCompare(
        `${toDateKey(a.scheduledDate)}${a.startTime}`,
      ),
    );

  const upcomingPageCount = Math.max(1, Math.ceil(upcoming.length / pageSize));
  const historyPageCount = Math.max(1, Math.ceil(history.length / pageSize));
  const safeUpcomingPage = Math.min(upcomingPage, upcomingPageCount);
  const safeHistoryPage = Math.min(historyPage, historyPageCount);
  const visibleUpcoming = upcoming.slice(
    (safeUpcomingPage - 1) * pageSize,
    safeUpcomingPage * pageSize,
  );
  const visibleHistory = history.slice(
    (safeHistoryPage - 1) * pageSize,
    safeHistoryPage * pageSize,
  );

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-[#181700]">Daftar Sesi</h2>
        <p className="mt-1 text-xs leading-relaxed text-stone-500">
          Ringkasan kronologis sesi terapi Anda, termasuk status dan fisioterapis yang menangani.
        </p>
      </div>

      <div className="rounded-3xl border border-stone-200 bg-white p-3.5 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[#181700]" />
            <h3 className="text-sm font-bold text-[#181700]">Sesi Mendatang</h3>
          </div>
          <span className="text-[11px] text-stone-500">{upcoming.length} sesi</span>
        </div>
        {visibleUpcoming.length === 0 ? (
          <p className="mt-3 rounded-2xl bg-[#FAFAF8] px-4 py-4 sm:py-6 text-center text-xs text-stone-500">
            Belum ada sesi mendatang. Ajukan jadwal lewat kalender di atas.
          </p>
        ) : (
          <>
            <ul className="mt-2 divide-y divide-stone-100">
              {visibleUpcoming.map((appointment) => (
                <SessionRow key={appointment.id} appointment={appointment} />
              ))}
            </ul>
            <PaginationBar
              page={safeUpcomingPage}
              pageCount={upcomingPageCount}
              pageSize={pageSize}
              pageSizeOptions={[4, 10, 25]}
              onPageChange={setUpcomingPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setUpcomingPage(1);
                setHistoryPage(1);
              }}
            />
          </>
        )}

      </div>

      <div className="rounded-3xl border border-stone-200 bg-white p-3.5 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-[#181700]" />
            <h3 className="text-sm font-bold text-[#181700]">Riwayat Sesi</h3>
          </div>
          <span className="text-[11px] text-stone-500">{history.length} sesi</span>
        </div>
        {visibleHistory.length === 0 ? (
          <p className="mt-3 rounded-2xl bg-[#FAFAF8] px-4 py-4 sm:py-6 text-center text-xs text-stone-500">
            Belum ada riwayat sesi terapi.
          </p>
        ) : (
          <>
            <ul className="mt-2 divide-y divide-stone-100">
              {visibleHistory.map((appointment) => (
                <SessionRow key={appointment.id} appointment={appointment} />
              ))}
            </ul>
            <PaginationBar
              page={safeHistoryPage}
              pageCount={historyPageCount}
              pageSize={pageSize}
              pageSizeOptions={[4, 10, 25]}
              onPageChange={setHistoryPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setUpcomingPage(1);
                setHistoryPage(1);
              }}
            />
          </>
        )}
      </div>
    </section>
  );
}
