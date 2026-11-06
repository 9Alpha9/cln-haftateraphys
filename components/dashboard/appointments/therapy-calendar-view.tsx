'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Plus,
  XCircle,
} from 'lucide-react';
import { GlobalSlideOver } from '@/components/ui/global-slide-over';
import { AppSelect } from '@/components/ui/app-select';
import type { CalendarAppointment } from '@/server/queries/appointment-calendar';
import { cn } from '@/lib/utils';
import { AppointmentFormDrawer } from '@/components/dashboard/appointments/appointment-form-drawer';
import { CompleteSessionButton } from '@/components/dashboard/appointments/complete-session-button';

type ViewMode = 'day' | 'week' | 'month' | 'agenda';
type SelectOption = { id: string; label: string };

const HOURS = Array.from({ length: 24 }, (_, index) => index);
const SLOT_HEIGHT = 64;
const WEEKDAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const TYPE_LABELS: Record<string, string> = {
  INITIAL_ASSESSMENT: 'Assessment Awal',
  THERAPY_SESSION: 'Sesi Terapi',
  FOLLOW_UP: 'Tindak Lanjut',
  EVALUATION: 'Evaluasi',
};

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Terjadwal',
  CONFIRMED: 'Terkonfirmasi',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
  RESCHEDULED: 'Dijadwalkan Ulang',
  NO_SHOW: 'Tidak Hadir',
};

const TIME_OPTIONS = Array.from({ length: 29 }, (_, index) => {
  const total = 7 * 60 + index * 30;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
});

function dateKey(value: Date | string) {
  if (typeof value === 'string') return value.slice(0, 10);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

function parseDateKey(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function startOfWeek(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  next.setDate(next.getDate() - ((day + 6) % 7));
  next.setHours(0, 0, 0, 0);
  return next;
}

function formatLongDate(date: Date) {
  return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function statusClass(status: string) {
  if (status === 'COMPLETED') return 'bg-[var(--hafta-grn-50)] border-[var(--hafta-grn-500)] text-[var(--hafta-grn-700)]';
  if (status === 'CANCELLED' || status === 'NO_SHOW') return 'bg-[var(--hafta-red-50)] border-[var(--hafta-red-500)] text-[var(--hafta-red-700)]';
  return 'bg-[var(--hafta-ylw-50)]/90 border-[var(--hafta-ylw-200)] text-[#181700]';
}

function statusBadgeClass(status: string) {
  if (status === 'COMPLETED') return 'bg-[var(--hafta-grn-50)] text-[var(--hafta-grn-700)] border-[var(--hafta-grn-200)]';
  if (status === 'CANCELLED' || status === 'NO_SHOW') return 'bg-[var(--hafta-red-50)] text-[var(--hafta-red-700)] border-[var(--hafta-red-200)]';
  return 'bg-[var(--hafta-ylw-50)] text-[var(--hafta-ylw-950)] border-[var(--hafta-ylw-200)]';
}

export function TherapyCalendarView({
  appointments,
  patientOptions,
  therapistOptions,
  canCreate,
  canComplete = false,
}: {
  appointments: CalendarAppointment[];
  patientOptions: SelectOption[];
  therapistOptions: SelectOption[];
  canCreate: boolean;
  canComplete?: boolean;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedAppointment, setSelectedAppointment] = useState<CalendarAppointment | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createDefaults, setCreateDefaults] = useState<{ date: string; time: string }>({ date: dateKey(new Date()), time: '08:00' });
  const [now, setNow] = useState(() => new Date());
  const [isMobile, setIsMobile] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1023px)');
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (viewMode !== 'day' && viewMode !== 'week') return;
    const container = scrollRef.current;
    if (!container) return;
    const frame = window.requestAnimationFrame(() => {
      container.scrollTop = Math.max(0, 7.5 * SLOT_HEIGHT - 24);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [viewMode, currentDate, isMobile]);

  const filteredAppointments = useMemo(
    () => appointments.filter((appointment) => statusFilter === 'ALL' || appointment.status === statusFilter),
    [appointments, statusFilter],
  );

  const groupByDate = useMemo(() => {
    const map = new Map<string, CalendarAppointment[]>();
    for (const appointment of filteredAppointments) {
      const key = dateKey(appointment.scheduledDate);
      const list = map.get(key) ?? [];
      list.push(appointment);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [filteredAppointments]);

  const weekStart = startOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const timelineDays = isMobile || viewMode === 'day' ? [isMobile ? currentDate : currentDate] : weekDays;
  const todayKey = dateKey(now);

  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthGridStart = startOfWeek(monthStart);
  const monthDays = Array.from({ length: 42 }, (_, index) => addDays(monthGridStart, index));
  const monthEvents = filteredAppointments.filter((appointment) => {
    const key = dateKey(appointment.scheduledDate);
    return parseDateKey(key).getMonth() === currentDate.getMonth() && parseDateKey(key).getFullYear() === currentDate.getFullYear();
  });

  function goToday() {
    setCurrentDate(new Date());
  }

  function step(direction: -1 | 1) {
    if (viewMode === 'day') setCurrentDate((date) => addDays(date, direction));
    else if (viewMode === 'week') setCurrentDate((date) => addDays(date, direction * 7));
    else setCurrentDate((date) => addMonths(date, direction));
  }

  function openCreate(date: string, time: string) {
    if (!canCreate) return;
    setCreateDefaults({ date, time });
    setIsCreateOpen(true);
  }

  let title: string;
  if (viewMode === 'month' || viewMode === 'agenda') {
    title = `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  } else if (viewMode === 'day') {
    title = formatLongDate(currentDate);
  } else {
    const weekEnd = addDays(weekStart, 6);
    title =
      weekStart.getMonth() === weekEnd.getMonth()
        ? `${weekStart.getDate()} – ${weekEnd.getDate()} ${MONTHS[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`
        : `${formatShortDate(weekStart)} – ${formatShortDate(weekEnd)} ${weekEnd.getFullYear()}`;
  }

  return (
    <>
      <div className="flex h-[calc(100dvh-230px)] min-h-[460px] max-h-[860px] flex-col overflow-hidden rounded-3xl border border-stone-200/70 bg-white shadow-[0_8px_30px_rgba(24,23,0,0.05)] lg:h-[calc(100vh-190px)] lg:min-h-[620px]">
        <div className="shrink-0 border-b border-stone-200/80 px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--hafta-ylw-100)] text-[#181700]">
                <CalendarDays className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold text-[#181700] sm:text-base">Jadwal Terapi</h2>
                <p className="truncate text-[11px] font-medium text-stone-500 sm:text-xs">{title}</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={goToday}
                className="h-8 cursor-pointer rounded-full border border-stone-200 bg-white px-3 text-[11px] font-semibold text-[#181700] transition-colors hover:bg-stone-50"
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Sebelumnya"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-stone-200 bg-white text-[#181700] transition-colors hover:bg-stone-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Berikutnya"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-stone-200 bg-white text-[#181700] transition-colors hover:bg-stone-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="no-scrollbar mt-2 flex items-center gap-2 overflow-x-auto pb-0.5">
            <div className="flex shrink-0 items-center rounded-full bg-stone-100 p-1">
              {(['day', 'week', 'month', 'agenda'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    'h-7 shrink-0 cursor-pointer rounded-full px-2.5 text-[11px] font-semibold transition-colors',
                    viewMode === mode ? 'bg-[#181700] text-white shadow-2xs' : 'text-stone-500 hover:text-[#181700]',
                  )}
                >
                  {mode === 'day' ? 'Hari' : mode === 'week' ? 'Minggu' : mode === 'month' ? 'Bulan' : 'Agenda'}
                </button>
              ))}
            </div>

            <AppSelect
              value={statusFilter}
              onChange={setStatusFilter}
              size="sm"
              align="right"
              className="w-32 shrink-0"
              menuClassName="z-20 min-w-44"
              aria-label="Filter status"
              options={[
                { value: 'ALL', label: 'Semua status' },
                { value: 'SCHEDULED', label: 'Terjadwal' },
                { value: 'CONFIRMED', label: 'Terkonfirmasi' },
                { value: 'COMPLETED', label: 'Selesai' },
                { value: 'CANCELLED', label: 'Dibatalkan' },
                { value: 'NO_SHOW', label: 'Tidak hadir' },
              ]}
            />

            {canCreate && (
              <button
                type="button"
                onClick={() => openCreate(dateKey(currentDate), '08:00')}
                className="inline-flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[var(--hafta-ylw-100)] px-3 text-[11px] font-bold text-[#181700] transition-colors hover:bg-[var(--hafta-ylw-200)]"
              >
                <Plus className="h-3.5 w-3.5" />
                Buat Jadwal
              </button>
            )}
          </div>
        </div>

        {viewMode === 'month' ? (
          isMobile ? (
            <AgendaView monthEvents={monthEvents} onSelect={setSelectedAppointment} />
          ) : (
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="grid shrink-0 grid-cols-7 border-b border-stone-200/80">
                {WEEKDAYS.map((day) => (
                  <div key={day} className="py-2 text-center text-[11px] font-semibold text-stone-500">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid flex-1 grid-cols-7 grid-rows-6 overflow-auto">
                {monthDays.map((day) => {
                  const key = dateKey(day);
                  const dayEvents = groupByDate.get(key) ?? [];
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                  return (
                    <div
                      key={key}
                      onClick={() => openCreate(key, '08:00')}
                      className={cn(
                        'min-h-0 cursor-pointer border-b border-r border-stone-100 p-1.5 transition-colors hover:bg-stone-50/70',
                        !isCurrentMonth && 'bg-stone-50/40',
                      )}
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span
                          className={cn(
                            'flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold',
                            key === todayKey ? 'bg-[#181700] text-white' : isCurrentMonth ? 'text-[#181700]' : 'text-stone-400',
                          )}
                        >
                          {day.getDate()}
                        </span>
                        {dayEvents.length > 0 && (
                          <span className="text-[9px] font-semibold text-stone-400">{dayEvents.length}</span>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 3).map((appointment) => (
                          <button
                            key={appointment.id}
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedAppointment(appointment);
                            }}
                            className={cn(
                              'block w-full cursor-pointer truncate rounded-md border-l-2 px-1.5 py-0.5 text-left text-[9px] font-semibold',
                              statusClass(appointment.status),
                            )}
                          >
                            {appointment.startTime} {appointment.patientName}
                          </button>
                        ))}
                        {dayEvents.length > 3 && (
                          <p className="pl-1 text-[9px] font-medium text-stone-500">+{dayEvents.length - 3} lainnya</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ) : viewMode === 'agenda' ? (
          <AgendaView monthEvents={monthEvents} onSelect={setSelectedAppointment} />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            {isMobile && (
              <div className="flex shrink-0 items-center justify-between gap-1 border-b border-stone-200/80 px-2 py-2">
                {weekDays.map((day) => {
                  const key = dateKey(day);
                  const dayEvents = groupByDate.get(key) ?? [];
                  const isActive = key === dateKey(currentDate);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setCurrentDate(day)}
                      className={cn(
                        'flex h-9 w-9 shrink-0 cursor-pointer flex-col items-center justify-center rounded-full text-[10px] font-semibold transition-colors',
                        isActive ? 'bg-[#181700] text-white' : 'text-stone-600 hover:bg-stone-100',
                      )}
                    >
                      <span>{day.getDate()}</span>
                      <span className={cn('mt-0.5 h-1 w-1 rounded-full', dayEvents.length > 0 && (isActive ? 'bg-[var(--hafta-ylw-200)]' : 'bg-[var(--hafta-ylw-400)]'))} />
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex shrink-0 border-b border-stone-200/80">
              <div className="w-14 shrink-0" />
              <div className="flex flex-1">
                {timelineDays.map((day, index) => {
                  const key = dateKey(day);
                  const isToday = key === todayKey;
                  const weekdayLabel = isMobile
                    ? WEEKDAYS[(day.getDay() + 6) % 7]
                    : index < 7
                      ? WEEKDAYS[(day.getDay() + 6) % 7]
                      : '';
                  return (
                    <div key={key} className="flex min-w-0 flex-1 flex-col items-center justify-center border-r border-stone-100 py-2 last:border-r-0">
                      <span className={cn('text-[10px] font-medium', day.getDay() === 0 ? 'text-[var(--hafta-red-500)]' : 'text-stone-500')}>
                        {weekdayLabel}
                      </span>
                      <span
                        className={cn(
                          'mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold',
                          isToday ? 'bg-[#181700] text-white' : 'text-[#181700]',
                        )}
                      >
                        {day.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <div className="relative flex pt-2">
                <div className="w-14 shrink-0 border-r border-stone-100">
                  {HOURS.map((hour) => (
                    <div key={hour} className="relative" style={{ height: SLOT_HEIGHT }}>
                      <span className="absolute right-2 top-0 -translate-y-1/2 font-mono text-[9px] font-medium text-stone-400">
                        {String(hour).padStart(2, '0')}:00
                      </span>
                    </div>
                  ))}
                </div>

                <div className="relative flex flex-1">
                  {timelineDays.map((day) => {
                    const key = dateKey(day);
                    const dayEvents = groupByDate.get(key) ?? [];
                    return (
                      <div key={key} className="relative flex-1 border-r border-stone-100 last:border-r-0" style={{ height: HOURS.length * SLOT_HEIGHT }}>
                        {HOURS.map((hour) => (
                          <button
                            key={hour}
                            type="button"
                            onClick={() => openCreate(key, `${String(hour).padStart(2, '0')}:00`)}
                            aria-label={`Buat jadwal ${key} ${hour}:00`}
                            className="absolute inset-x-0 cursor-pointer border-b border-stone-100/80 transition-colors hover:bg-[var(--hafta-ylw-50)]/40"
                            style={{ top: hour * SLOT_HEIGHT, height: SLOT_HEIGHT }}
                          />
                        ))}

                        {dayEvents.map((appointment) => {
                          const [hour, minute] = appointment.startTime.split(':').map(Number);
                          const top = ((hour + (minute || 0) / 60) / 1) * SLOT_HEIGHT;
                          const height = Math.max(26, (appointment.durationMinutes / 60) * SLOT_HEIGHT);
                          return (
                            <button
                              key={appointment.id}
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedAppointment(appointment);
                              }}
                              className={cn(
                                'absolute left-0.5 right-0.5 z-10 cursor-pointer overflow-hidden rounded-xl border-l-4 p-1.5 text-left shadow-2xs transition-transform hover:z-20 hover:scale-[1.01]',
                                statusClass(appointment.status),
                              )}
                              style={{ top, height }}
                            >
                              <p className="truncate text-[10px] font-bold leading-tight">{appointment.patientName}</p>
                              <p className="mt-0.5 flex items-center gap-1 truncate text-[9px] font-medium opacity-80">
                                <Clock className="h-2.5 w-2.5 shrink-0" />
                                {appointment.startTime} · {appointment.durationMinutes}m
                              </p>
                              {height > 52 && (
                                <p className="mt-1 truncate text-[9px] font-medium opacity-70">
                                  {TYPE_LABELS[appointment.type] ?? appointment.type}
                                </p>
                              )}
                              {appointment.status === 'COMPLETED' && (
                                <CheckCircle2 className="absolute bottom-1 right-1 h-3 w-3 opacity-80" />
                              )}
                              {(appointment.status === 'CANCELLED' || appointment.status === 'NO_SHOW') && (
                                <XCircle className="absolute bottom-1 right-1 h-3 w-3 opacity-80" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}

                  {timelineDays.some((day) => dateKey(day) === todayKey) && (
                    (() => {
                      const index = timelineDays.findIndex((day) => dateKey(day) === todayKey);
                      const total = timelineDays.length;
                      const top = (now.getHours() + now.getMinutes() / 60) * SLOT_HEIGHT;
                      return (
                        <div
                          className="pointer-events-none absolute z-20 flex items-center"
                          style={{ left: `${(index / total) * 100}%`, width: `${100 / total}%`, top }}
                        >
                          <span className="h-2 w-2 shrink-0 -translate-x-1 rounded-full bg-[var(--hafta-red-500)]" />
                          <span className="h-0.5 flex-1 bg-[var(--hafta-red-500)]" />
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <GlobalSlideOver
        isOpen={Boolean(selectedAppointment)}
        onClose={() => setSelectedAppointment(null)}
        icon={<CalendarDays className="h-5 w-5" />}
        title={selectedAppointment?.patientName ?? 'Detail Jadwal'}
        subtitle={selectedAppointment ? `${TYPE_LABELS[selectedAppointment.type] ?? selectedAppointment.type}` : undefined}
        badge={
          selectedAppointment ? (
            <span className={cn('rounded-full border px-2.5 py-0.5 text-[10px] font-semibold', statusBadgeClass(selectedAppointment.status))}>
              {STATUS_LABELS[selectedAppointment.status] ?? selectedAppointment.status}
            </span>
          ) : null
        }
        footer={
          selectedAppointment ? (
            <div
              className={cn(
                'flex w-full items-center gap-2',
                canComplete &&
                  (selectedAppointment.status === 'SCHEDULED' ||
                    selectedAppointment.status === 'CONFIRMED')
                  ? 'justify-between'
                  : 'justify-end',
              )}
            >
              {canComplete &&
              (selectedAppointment.status === 'SCHEDULED' ||
                selectedAppointment.status === 'CONFIRMED') ? (
                <CompleteSessionButton
                  appointmentId={selectedAppointment.id}
                  className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[var(--hafta-ylw-100)] px-4 text-xs font-bold text-[#181700] shadow-2xs transition-colors hover:bg-[var(--hafta-ylw-200)] sm:h-11 sm:px-5 sm:text-[13px]"
                />
              ) : null}
              <Link
                href={`/dashboard/appointments/${selectedAppointment.id}`}
                className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full border border-stone-200/90 bg-white px-4 text-xs font-semibold text-[#181700] transition-colors hover:bg-stone-100 sm:h-11 sm:px-5 sm:text-[13px]"
              >
                Buka Manajemen Sesi
              </Link>
            </div>
          ) : null
        }
      >
        {selectedAppointment && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-stone-200/70 bg-[#FBFBFA] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">
                    Pasien
                  </p>
                  <p className="mt-1 truncate text-sm font-bold text-[#181700]">
                    {selectedAppointment.patientName}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-stone-500">
                    Terapis: {selectedAppointment.therapistName ?? '-'}
                  </p>
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold',
                    statusBadgeClass(selectedAppointment.status),
                  )}
                >
                  {STATUS_LABELS[selectedAppointment.status] ?? selectedAppointment.status}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200/70 bg-white p-4">
              <dl className="space-y-3">
                {[
                  ['Tanggal', formatLongDate(parseDateKey(dateKey(selectedAppointment.scheduledDate)))],
                  ['Waktu', `${selectedAppointment.startTime} • ${selectedAppointment.durationMinutes} menit WIB`],
                  ['Tipe', TYPE_LABELS[selectedAppointment.type] ?? selectedAppointment.type],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-400">
                      {label}
                    </dt>
                    <dd className="mt-1 text-xs font-semibold leading-relaxed text-[#181700] sm:text-sm">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        )}
      </GlobalSlideOver>

      <AppointmentFormDrawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        patientOptions={patientOptions}
        therapistOptions={therapistOptions}
        defaultDate={createDefaults.date}
        defaultTime={createDefaults.time}
      />
    </>
  );
}

function AgendaView({ monthEvents, onSelect }: { monthEvents: CalendarAppointment[]; onSelect: (appointment: CalendarAppointment) => void }) {
  const grouped = useMemo(() => {
    const map = new Map<string, CalendarAppointment[]>();
    for (const appointment of monthEvents) {
      const key = dateKey(appointment.scheduledDate);
      const list = map.get(key) ?? [];
      list.push(appointment);
      map.set(key, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [monthEvents]);

  if (grouped.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <CalendarDays className="h-9 w-9 text-stone-300" />
        <p className="text-sm font-semibold text-[#181700]">Belum ada jadwal</p>
        <p className="text-xs text-stone-500">Tidak ada sesi pada periode ini.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-4 lg:p-5">
      <div className="space-y-4 sm:space-y-5">
        {grouped.map(([key, items]) => (
          <section key={key}>
            <h3 className="mb-2 text-xs font-semibold text-stone-500">{formatLongDate(parseDateKey(key))}</h3>
            <div className="space-y-2">
              {items.map((appointment) => (
                <button
                  key={appointment.id}
                  type="button"
                  onClick={() => onSelect(appointment)}
                  className={cn(
                    'flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border-l-4 p-3 text-left transition-transform hover:scale-[1.005]',
                    statusClass(appointment.status),
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{appointment.patientName}</p>
                    <p className="truncate text-xs font-medium opacity-80">
                      {appointment.startTime} • {TYPE_LABELS[appointment.type] ?? appointment.type} • {appointment.therapistName ?? '-'}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] font-semibold">{STATUS_LABELS[appointment.status] ?? appointment.status}</span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

