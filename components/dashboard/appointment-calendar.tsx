'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { markCalendarAppointmentsRead } from '@/server/actions/appointment-notifications';
import type { CalendarAppointment } from '@/server/queries/appointment-calendar';
import type { IndonesianHoliday } from '@/server/queries/indonesian-holidays';
import type { InternalCalendarEvent } from '@/server/queries/internal-calendar-events';

const monthFormatter = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' });
const weekdayLabels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const typeLabel: Record<string, string> = {
  INITIAL_ASSESSMENT: 'Assessment Awal',
  THERAPY_SESSION: 'Sesi Terapi',
  FOLLOW_UP: 'Tindak Lanjut',
  EVALUATION: 'Evaluasi',
};

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
function dateKey(date: Date) {
  return `${monthKey(date)}-${String(date.getDate()).padStart(2, '0')}`;
}
function appointmentDateKey(value: string) {
  return value.slice(0, 10);
}

export function AppointmentCalendar({
  appointments,
  initialMonth,
  holidays,
  internalEvents,
}: {
  appointments: CalendarAppointment[];
  initialMonth: string;
  holidays: IndonesianHoliday[];
  internalEvents: InternalCalendarEvent[];
}) {
  const router = useRouter();
  const [month, setMonth] = useState(() => {
    const [year, currentMonth] = initialMonth.split('-').map(Number);
    return new Date(year, currentMonth - 1, 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const unreadIds = useMemo(
    () => appointments.filter((appointment) => appointment.isNew).map((appointment) => appointment.id),
    [appointments],
  );
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarAppointment[]>();
    appointments.forEach((appointment) => {
      const key = appointmentDateKey(appointment.scheduledDate);
      map.set(key, [...(map.get(key) ?? []), appointment]);
    });
    return map;
  }, [appointments]);
  const holidaysByDate = useMemo(() => new Map(holidays.map((holiday) => [holiday.date, holiday])), [holidays]);
  const internalEventsByDate = useMemo(() => {
    const map = new Map<string, InternalCalendarEvent[]>();
    internalEvents.forEach((event) => {
      const key = appointmentDateKey(event.scheduledDate);
      map.set(key, [...(map.get(key) ?? []), event]);
    });
    return map;
  }, [internalEvents]);
  const selectedAppointments = selectedDate ? (eventsByDate.get(selectedDate) ?? []) : [];
  const selectedInternalEvents = selectedDate ? (internalEventsByDate.get(selectedDate) ?? []) : [];
  const days = useMemo(() => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    return Array.from({ length: firstDay.getDay() + lastDay.getDate() }, (_, index) =>
      index < firstDay.getDay() ? null : new Date(month.getFullYear(), month.getMonth(), index - firstDay.getDay() + 1),
    );
  }, [month]);

  useEffect(() => {
    if (unreadIds.length === 0) return;
    const timeout = window.setTimeout(async () => {
      await markCalendarAppointmentsRead(unreadIds);
      router.refresh();
    }, 2500);
    return () => window.clearTimeout(timeout);
  }, [router, unreadIds]);
  function changeMonth(offset: number) {
    const next = new Date(month.getFullYear(), month.getMonth() + offset, 1);
    setMonth(next);
    setSelectedDate(null);
    router.push(`/dashboard?month=${monthKey(next)}`);
  }

  return (
    <section className="rounded-xl border border-border bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/20">
            <CalendarDays className="h-4 w-4 text-[#92400e]" />
          </span>
          <div>
            <h2 className="font-semibold text-foreground">Kalender Terapi</h2>
            <p className="text-xs text-muted-foreground">Pilih tanggal untuk melihat jadwal.</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-1 rounded-lg border border-border bg-surface p-1">
          <Button variant="ghost" size="icon" aria-label="Bulan sebelumnya" onClick={() => changeMonth(-1)}>
            <ChevronLeft />
          </Button>
          <p className="min-w-32 text-center text-sm font-semibold text-foreground">{monthFormatter.format(month)}</p>
          <Button variant="ghost" size="icon" aria-label="Bulan berikutnya" onClick={() => changeMonth(1)}>
            <ChevronRight />
          </Button>
        </div>
      </div>
      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(15rem,.65fr)]">
        <div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-muted-foreground">
            {weekdayLabels.map((label) => (
              <span key={label} className="py-1">
                {label}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (!day)
                return <span key={`empty-${index}`} className="min-h-10 rounded-md bg-surface/60 sm:min-h-12" />;
              const key = dateKey(day);
              const holiday = holidaysByDate.get(key);
              const isSunday = day.getDay() === 0;
              const isRedDay = isSunday || Boolean(holiday);
              const dayAppointments = eventsByDate.get(key) ?? [];
              const dayInternalEvents = internalEventsByDate.get(key) ?? [];
              const hasNew = dayAppointments.some((appointment) => appointment.isNew);
              const isSelected = selectedDate === key;
              return (
                <button
                  type="button"
                  key={key}
                  title={holiday?.name ?? (isSunday ? 'Minggu' : undefined)}
                  onClick={() => setSelectedDate(key)}
                  className={cn(
                    'relative min-h-10 rounded-md p-1 text-left transition-colors sm:min-h-12',
                    isSelected
                      ? 'bg-accent text-accent-foreground'
                      : dayAppointments.length
                        ? 'bg-accent/20 text-[#92400e] hover:bg-accent/30'
                        : 'hover:bg-surface',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold',
                      !isSelected && isRedDay && 'text-destructive',
                    )}
                  >
                    {day.getDate()}
                  </span>
                  {dayAppointments.length > 0 ? (
                    <span
                      className={cn(
                        'mt-0.5 block text-[9px] font-bold',
                        isSelected ? 'text-accent-foreground' : 'text-[#92400e]',
                      )}
                    >
                      {dayAppointments.length}
                    </span>
                  ) : null}
                  {dayInternalEvents.length > 0 ? (
                    <span
                      className={cn(
                        'absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-[#f59e0b]',
                        isSelected && 'bg-accent-foreground',
                      )}
                      title={dayInternalEvents.map((event) => event.title).join(', ')}
                    />
                  ) : null}
                  {hasNew ? (
                    <motion.span
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: [1, 1.08, 1], opacity: 1 }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1.8 }}
                      className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-accent"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
        <div className="rounded-lg bg-surface p-3">
          <p className="text-sm font-semibold text-foreground">
            {selectedDate
              ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })
              : 'Pilih tanggal'}
          </p>
          <AnimatePresence mode="wait">
            {selectedDate ? (
              <motion.div
                key={selectedDate}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mt-3 space-y-2"
              >
                {selectedInternalEvents.map((event) => (
                  <div key={event.id} className="rounded-lg border border-accent/30 bg-accent/10 p-3">
                    <p className="text-sm font-semibold text-foreground">{event.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {event.startTime ?? 'Seharian'} · {event.eventType.replaceAll('_', ' ')}
                    </p>
                    {event.description ? (
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{event.description}</p>
                    ) : null}
                  </div>
                ))}
                {selectedAppointments.length === 0 && selectedInternalEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Tidak ada jadwal pada tanggal ini.</p>
                ) : (
                  selectedAppointments.map((appointment) => (
                    <motion.div
                      key={appointment.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="rounded-lg border border-border bg-white p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">{appointment.patientName}</p>
                        {appointment.isNew ? (
                          <span className="rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-bold text-accent-foreground">
                            BARU
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock3 className="h-3.5 w-3.5 text-[#92400e]" />
                        {appointment.startTime} · {typeLabel[appointment.type] ?? appointment.type}
                      </p>
                    </motion.div>
                  ))
                )}
              </motion.div>
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Jadwal terapi pada tanggal yang dipilih akan tampil di sini.
              </p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
