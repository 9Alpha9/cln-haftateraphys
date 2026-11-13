'use client';

import { useMemo, useState } from 'react';
import {
  CalendarDays,
  CalendarX2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  UserRound,
} from 'lucide-react';
import { GlobalSlideOver } from '@/components/ui/global-slide-over';
import { cn } from '@/lib/utils';

type StaffAppointment = {
  id: string;
  scheduledDate: string;
  startTime: string;
  durationMinutes: number;
  status: string;
  patientName: string;
};

type Holiday = { date: string; name: string };

const WEEKDAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Terjadwal',
  CONFIRMED: 'Terkonfirmasi',
  IN_PROGRESS: 'Sedang berjalan',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
  RESCHEDULED: 'Dijadwalkan ulang',
  NO_SHOW: 'Tidak hadir',
};

function dateKey(value: Date | string) {
  if (typeof value === 'string') return value.slice(0, 10);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(
    value.getDate(),
  ).padStart(2, '0')}`;
}

function parseDateKey(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function formatLongDate(key: string) {
  return parseDateKey(key).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function TherapistMonthCalendar({
  appointments,
  holidays = [],
}: {
  appointments: StaffAppointment[];
  holidays?: Holiday[];
}) {
  const todayKey = dateKey(new Date());
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(todayKey);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const holidayMap = useMemo(
    () => new Map(holidays.map((holiday) => [holiday.date.slice(0, 10), holiday.name])),
    [holidays],
  );
  const byDate = useMemo(() => {
    const map = new Map<string, StaffAppointment[]>();
    for (const appointment of appointments) {
      const key = dateKey(appointment.scheduledDate);
      map.set(key, [...(map.get(key) ?? []), appointment]);
    }
    return map;
  }, [appointments]);

  const days = useMemo(() => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const prefix = firstDay.getDay();
    return Array.from({ length: prefix + lastDay.getDate() }, (_, index) =>
      index < prefix ? null : new Date(month.getFullYear(), month.getMonth(), index - prefix + 1),
    );
  }, [month]);

  const selectedAppointments = selectedDate
    ? [...(byDate.get(selectedDate) ?? [])].sort((a, b) => a.startTime.localeCompare(b.startTime))
    : [];

  function changeMonth(offset: number) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
    setSelectedDate(null);
  }

  function goToToday() {
    const today = new Date();
    setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(todayKey);
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full min-w-0 items-center gap-1 rounded-full border border-stone-200 bg-white p-1 sm:w-auto">
          <button
            type="button"
            aria-label="Bulan sebelumnya"
            onClick={() => changeMonth(-1)}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#181700] transition-colors hover:bg-stone-100 sm:h-10 sm:w-10"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="min-w-0 flex-1 text-center text-xs font-bold text-[#181700] sm:min-w-32 sm:flex-none sm:text-sm">
            {MONTHS[month.getMonth()]} {month.getFullYear()}
          </p>
          <button
            type="button"
            aria-label="Bulan berikutnya"
            onClick={() => changeMonth(1)}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#181700] transition-colors hover:bg-stone-100 sm:h-10 sm:w-10"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goToToday}
            className="ml-0.5 h-9 shrink-0 cursor-pointer rounded-full bg-[#181700] px-2.5 text-[10px] font-semibold text-white transition-colors hover:bg-[#2a2800] sm:h-10 sm:px-3.5 sm:text-[11px]"
          >
            Hari ini
          </button>
        </div>
        <p className="text-[11px] leading-relaxed text-stone-500">
          {appointments.length} sesi pada rentang jadwal aktif
        </p>
      </div>

      <div>
        <div className="mx-auto grid w-full max-w-[460px] grid-cols-7 text-center text-[11px] font-semibold uppercase tracking-wide text-stone-400 sm:max-w-[560px] lg:max-w-none">
          {WEEKDAYS.map((label) => (
            <span key={label} className="py-2">
              {label}
            </span>
          ))}
        </div>
        <div className="mx-auto mt-1 grid w-full max-w-[460px] grid-cols-7 gap-1.5 sm:max-w-[560px] sm:gap-2 lg:max-w-none lg:gap-2.5">
          {days.map((day, index) => {
            if (!day) return <span key={`empty-${index}`} className="min-h-11" />;
            const key = dateKey(day);
            const sessions = (byDate.get(key) ?? []).filter((appointment) =>
              ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'].includes(appointment.status),
            );
            const holidayName = holidayMap.get(key);
            const isSunday = day.getDay() === 0;
            const isPast = key < todayKey;
            const isSelected = selectedDate === key;
            const isToday = key === todayKey;
            const unavailable = isPast || isSunday || Boolean(holidayName);

            return (
              <button
                type="button"
                key={key}
                title={holidayName ?? (isSunday ? 'Minggu' : isToday ? 'Hari ini' : undefined)}
                onClick={() => {
                  setSelectedDate(key);
                  setIsDrawerOpen(true);
                  setMonth(new Date(day.getFullYear(), day.getMonth(), 1));
                }}
                className="group flex min-h-[58px] w-full cursor-pointer flex-col items-center justify-start gap-1 px-0 py-1 text-sm font-bold transition-colors lg:min-h-[76px]"
              >
                <span
                  className={cn(
                    'mx-auto flex h-9 w-9 aspect-square items-center justify-center rounded-full leading-none transition-all sm:h-10 sm:w-10',
                    sessions.length > 0
                      ? 'bg-[#181700] text-white'
                      : unavailable
                        ? isSunday || holidayName
                          ? 'text-[var(--hafta-red-400)]'
                          : 'text-stone-300'
                        : 'text-stone-600 group-hover:bg-stone-100',
                    isToday && !isSelected && 'ring-1 ring-[#181700]/25',
                    isSelected && 'ring-2 ring-[#181700] ring-offset-2 ring-offset-white',
                  )}
                >
                  {day.getDate()}
                </span>
                {sessions.length > 0 ? (
                  <span className="flex max-w-full items-center justify-center gap-0.5">
                    {sessions.slice(0, 4).map((_, dotIndex) => (
                      <span
                        key={dotIndex}
                        className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--hafta-org-300)]"
                      />
                    ))}
                    {sessions.length > 4 ? (
                      <span className="text-[8px] font-bold leading-none text-stone-500">
                        +{sessions.length - 4}
                      </span>
                    ) : null}
                  </span>
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-transparent" />
                )}
                {sessions.length > 0 ? (
                  <span className="hidden max-w-full truncate text-[9px] font-semibold text-stone-500 lg:block">
                    {sessions[0].startTime.slice(0, 5)}
                    {sessions.length > 1 ? ` +${sessions.length - 1}` : ''}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-stone-100 pt-3 text-[10px] text-stone-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#181700]" /> Ada sesi
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--hafta-red-400)]" /> Hari Libur / Minggu
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--hafta-org-100)]" /> Sesi aktif
          </span>
        </div>
      </div>

      <GlobalSlideOver
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        size="sm"
        icon={<CalendarDays className="h-5 w-5 text-[#181700]" />}
        title="Detail Tanggal"
        subtitle={selectedDate ? formatLongDate(selectedDate) : undefined}
        footer={
          <button
            type="button"
            onClick={() => setIsDrawerOpen(false)}
            className="flex h-10 w-full cursor-pointer items-center justify-center rounded-full border border-stone-200 bg-white text-xs font-semibold text-[#181700] hover:bg-stone-50"
          >
            Tutup
          </button>
        }
      >
        <div className="space-y-3">
          {selectedAppointments.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-white px-4 py-8 text-center">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#FAFAF8] text-stone-400">
                <CalendarX2 className="h-5 w-5" />
              </span>
              <p className="mt-2 text-sm font-semibold text-[#181700]">Tidak ada sesi</p>
              <p className="mt-1 text-xs text-stone-500">
                Belum ada jadwal terapi pada tanggal ini.
              </p>
            </div>
          ) : (
            selectedAppointments.map((appointment) => (
              <div key={appointment.id} className="rounded-2xl bg-[#181700] p-3 text-white">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">{appointment.patientName}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-stone-300">
                      <Clock3 className="h-3.5 w-3.5" />
                      {appointment.startTime.slice(0, 5)} WIB · {appointment.durationMinutes} menit
                    </p>
                  </div>
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-[var(--hafta-org-100)]">
                    {STATUS_LABELS[appointment.status] ?? appointment.status}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2 border-t border-white/10 pt-2 text-xs text-stone-300">
                  <UserRound className="h-4 w-4 text-[var(--hafta-org-100)]" />
                  Fisioterapis Hafta
                </div>
              </div>
            ))
          )}
        </div>
      </GlobalSlideOver>
    </section>
  );
}
