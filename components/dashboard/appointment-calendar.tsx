'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, UserRound } from 'lucide-react';
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
    <section className="rounded-2xl border border-[#E8ECEB] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#E8ECEB] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-hafta-ylw-50">
            <CalendarDays className="h-4 w-4 text-hafta-ylw-700" strokeWidth={2.25} />
          </span>
          <div>
            <h2 className="font-semibold text-[#111827]">Kalender Terapi</h2>
            <p className="text-xs text-[#6B7280]">Pilih tanggal untuk melihat jadwal.</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-1 rounded-xl border border-[#E8ECEB] bg-[#F9FAFB] p-1">
          <Button variant="ghost" size="icon" aria-label="Bulan sebelumnya" onClick={() => changeMonth(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="min-w-32 text-center text-sm font-semibold text-[#111827]">{monthFormatter.format(month)}</p>
          <Button variant="ghost" size="icon" aria-label="Bulan berikutnya" onClick={() => changeMonth(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(15rem,.65fr)]">
        <div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-[#9CA3AF]">
            {weekdayLabels.map((label, index) => (
              <span key={label} className={cn('py-1', index === 0 && 'text-hafta-red-500 font-bold')}>
                {label}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (!day)
                return <span key={`empty-${index}`} className="min-h-10 rounded-xl bg-[#F9FAFB] sm:min-h-12" />;
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
                    'relative flex min-h-12 flex-col items-center justify-center rounded-xl p-1 text-center transition-all duration-150 sm:min-h-14',
                     isSelected
                       ? 'bg-hafta-ylw-200 text-hafta-ylw-900 shadow-md'
                       : dayAppointments.length
                         ? 'bg-hafta-ylw-50 text-hafta-ylw-900 ring-1 ring-hafta-ylw-100 hover:bg-hafta-ylw-100'
                         : 'hover:bg-[#F9FAFB]',
                  )}
                >
                  <span
                    className={cn(
                       'text-[13px] font-semibold leading-none',
                       !isSelected && isRedDay ? 'text-hafta-red-600' : 'text-[#111827]',
                       isSelected && 'text-hafta-ylw-900'
                    )}
                  >
                    {day.getDate()}
                  </span>
                  
                  {/* Indicator Dot untuk janji temu */}
                  {dayAppointments.length > 0 ? (
                    <div className="mt-1 flex gap-0.5">
                      {dayAppointments.slice(0, 3).map((_, i) => (
                        <span
                          key={i}
                          className={cn(
                            'h-1 w-1 rounded-full',
                            isSelected ? 'bg-hafta-ylw-900' : 'bg-hafta-ylw-600'
                          )}
                        />
                      ))}
                      {dayAppointments.length > 3 && (
                        <span className={cn('text-[7px] leading-[4px] font-bold', isSelected ? 'text-hafta-ylw-900' : 'text-hafta-ylw-600')}>+</span>
                      )}
                    </div>
                  ) : (
                    <span className="mt-1 h-1 w-1" /> /* Spacer agar angka tetap seimbang di tengah */
                  )}

                  {/* Indicator Dot untuk internal events */}
                  {dayInternalEvents.length > 0 ? (
                    <span
                      className={cn(
                        'absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-hafta-ylw-400',
                        isSelected && 'bg-hafta-ylw-800'
                      )}
                      title={dayInternalEvents.map((event) => event.title).join(', ')}
                    />
                  ) : null}
                  {hasNew ? (
                    <motion.span
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: [1, 1.08, 1], opacity: 1 }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1.8 }}
                      className="absolute left-2 top-2 h-1.5 w-1.5 rounded-full bg-hafta-ble-500"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
        <div className="rounded-xl bg-[#F9FAFB] p-3">
          <p className="text-sm font-semibold text-[#111827]">
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
                  <div key={event.id} className="rounded-xl border border-hafta-ylw-100 bg-hafta-ylw-50 p-4 shadow-sm">
                    <p className="text-sm font-bold text-hafta-ylw-900">{event.title}</p>
                    <p className="mt-1 text-[11px] font-semibold text-hafta-ylw-700">
                      {event.startTime ?? 'Seharian'} · {event.eventType.replaceAll('_', ' ')}
                    </p>
                    {event.description ? (
                      <p className="mt-2 text-xs leading-relaxed text-hafta-ylw-800">{event.description}</p>
                    ) : null}
                  </div>
                ))}
                {selectedAppointments.length === 0 && selectedInternalEvents.length === 0 ? (
                  <p className="text-sm text-[#6B7280] text-center mt-6">Tidak ada jadwal pada tanggal ini.</p>
                ) : (
                  selectedAppointments.map((appointment) => (
                    <motion.div
                      key={appointment.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#F1F5F9] text-[#64748B]">
                          {appointment.therapistImage ? (
                            <Image
                              src={appointment.therapistImage}
                              alt={appointment.therapistName ?? 'Terapis'}
                              width={44}
                              height={44}
                              className="h-full w-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <UserRound className="h-5 w-5" strokeWidth={2} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-[13px] font-bold text-[#111827] truncate">{typeLabel[appointment.type] ?? appointment.type}</p>
                              <p className="mt-0.5 text-[11px] font-medium text-[#6B7280] truncate">Dengan {appointment.therapistName ?? 'Terapis Hafta'}</p>
                            </div>
                            {appointment.isNew ? (
                              <span className="shrink-0 rounded-full bg-hafta-ble-50 px-2 py-0.5 text-[9px] font-bold text-hafta-ble-600">Baru</span>
                            ) : null}
                          </div>
                          
                          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-semibold text-[#64748B]">
                            <span className="inline-flex items-center gap-1">
                              <Clock3 className="h-3.5 w-3.5 text-hafta-ylw-600" strokeWidth={2.25} />
                              {appointment.startTime}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <span className="h-1 w-1 rounded-full bg-[#D1D5DB]" />
                              {appointment.durationMinutes} menit
                            </span>
                          </div>
                          <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Status: {appointment.status.replaceAll('_', ' ')}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
                Jadwal terapi pada tanggal yang dipilih akan tampil di sini.
              </p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
