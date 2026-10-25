'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Filter,
  LayoutGrid,
  List,
  MoreVertical,
  Pencil,
  Phone,
  Plus,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlobalSlideOver } from '@/components/ui/global-slide-over';
import { MedicalRecordFormDrawer } from '@/components/dashboard/progress/medical-record-form-drawer';
import { NewAppointmentButton } from '@/components/dashboard/appointments/new-appointment-button';
import { CompleteSessionButton } from '@/components/dashboard/appointments/complete-session-button';
import {
  AppointmentEditDrawer,
  useAppointmentEditDrawer,
} from '@/components/dashboard/appointments/appointment-edit-drawer';
import type { ScheduleAppointment } from '@/server/queries/appointment-calendar';

const DAY_LABELS = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];
const MONTH_SHORT = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];
const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const TYPE_LABELS: Record<string, string> = {
  INITIAL_ASSESSMENT: 'Assessment Awal',
  THERAPY_SESSION: 'Sesi Terapi',
  FOLLOW_UP: 'Sesi Lanjutan',
  EVALUATION: 'Evaluasi Klinis',
};

type ViewMode = 'list' | 'grid';
type StatusFilter = 'ALL' | 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED';

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function toDayKey(value: string): string {
  return value.slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return startTime;
  const total = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor((total % (24 * 60)) / 60);
  const endMinutes = total % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}

function formatLongDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatStripMonthLabel(dates: Date[]): string {
  if (dates.length === 0) return '';
  const first = dates[0];
  const last = dates[dates.length - 1];

  if (first.getFullYear() === last.getFullYear()) {
    if (first.getMonth() === last.getMonth()) {
      return `${MONTH_NAMES[first.getMonth()]} ${first.getFullYear()}`;
    }
    return `${MONTH_NAMES[first.getMonth()]} – ${MONTH_NAMES[last.getMonth()]} ${last.getFullYear()}`;
  }

  return `${MONTH_NAMES[first.getMonth()]} ${first.getFullYear()} – ${MONTH_NAMES[last.getMonth()]} ${last.getFullYear()}`;
}

function getStatusMeta(status: string) {
  if (status === 'SCHEDULED' || status === 'CONFIRMED') {
    return {
      label: status === 'CONFIRMED' ? 'Dikonfirmasi' : 'Terjadwal',
      accent: 'bg-[var(--hafta-grn-500)]',
      badge: 'bg-[var(--hafta-grn-50)] text-[var(--hafta-grn-600)]',
      icon: Check,
    };
  }
  if (status === 'RESCHEDULED') {
    return {
      label: 'Perubahan Jadwal',
      accent: 'bg-[var(--hafta-ylw-200)]',
      badge: 'border border-[var(--hafta-ylw-200)] bg-[var(--hafta-ylw-50)] text-[#181700]',
      icon: Clock,
    };
  }
  if (status === 'CANCELLED' || status === 'NO_SHOW') {
    return {
      label: status === 'NO_SHOW' ? 'Tidak Hadir' : 'Dibatalkan',
      accent: 'bg-[var(--hafta-red-500)]',
      badge: 'bg-[var(--hafta-red-50)] text-[var(--hafta-red-600)]',
      icon: X,
    };
  }
  return {
    label: 'Selesai',
    accent: 'bg-stone-300',
    badge: 'bg-stone-100 text-stone-600',
    icon: Check,
  };
}

export function TherapistScheduleCalendar({
  appointments,
  canCreate = false,
  canComplete = false,
  holidays = [],
}: {
  appointments: ScheduleAppointment[];
  canCreate?: boolean;
  canComplete?: boolean;
  holidays?: { date: string; name: string }[];
}) {
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);
  const todayKey = toDateKey(today);

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const appointment of appointments) {
      const dayKey = toDayKey(appointment.scheduledDate);
      map.set(dayKey, (map.get(dayKey) ?? 0) + 1);
    }
    return map;
  }, [appointments]);

  const holidayDateSet = useMemo(() => new Set(holidays.map((holiday) => holiday.date)), [holidays]);
  const holidayNameByDate = useMemo(
    () => new Map(holidays.map((holiday) => [holiday.date, holiday.name])),
    [holidays]
  );

  const initialSelectedDate = useMemo(() => {
    if (sessionsByDate.has(todayKey)) return todayKey;
    const nextAppointment = appointments.find(
      (appointment) => toDayKey(appointment.scheduledDate) >= todayKey
    );
    return nextAppointment ? toDayKey(nextAppointment.scheduledDate) : null;
  }, [appointments, sessionsByDate, todayKey]);

  const [stripStart, setStripStart] = useState<Date>(() => {
    if (!initialSelectedDate) return today;
    const [year, month, day] = initialSelectedDate.split('-').map(Number);
    return new Date(year, month - 1, day);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(initialSelectedDate);
  const [view, setView] = useState<ViewMode>('list');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [filterOpen, setFilterOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [detailAppointment, setDetailAppointment] = useState<ScheduleAppointment | null>(null);
  const appointmentEditor = useAppointmentEditDrawer();
  const [evaluationAppointment, setEvaluationAppointment] = useState<ScheduleAppointment | null>(null);
  const [visibleCount, setVisibleCount] = useState(5);

  useEffect(() => {
    const updateVisibleCount = () => {
      const width = window.innerWidth;
      setVisibleCount(width >= 1280 ? 14 : width >= 1024 ? 10 : width >= 640 ? 7 : 5);
    };
    const frame = window.requestAnimationFrame(updateVisibleCount);

    window.addEventListener('resize', updateVisibleCount);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', updateVisibleCount);
    };
  }, []);

  const stripDates = useMemo(
    () => Array.from({ length: visibleCount }, (_, index) => addDays(stripStart, index)),
    [stripStart, visibleCount]
  );

  const monthRangeLabel = useMemo(() => formatStripMonthLabel(stripDates), [stripDates]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      if (selectedDate && toDayKey(appointment.scheduledDate) !== selectedDate) return false;
      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'CANCELLED') {
        return appointment.status === 'CANCELLED' || appointment.status === 'NO_SHOW';
      }
      return appointment.status === statusFilter;
    });
  }, [appointments, selectedDate, statusFilter]);

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'ALL', label: 'Semua Status' },
    { value: 'SCHEDULED', label: 'Terjadwal' },
    { value: 'CONFIRMED', label: 'Dikonfirmasi' },
    { value: 'CANCELLED', label: 'Dibatalkan' },
  ];

  return (
    <section className="rounded-3xl border border-stone-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(24,23,0,0.03)] sm:p-7">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--hafta-ylw-100)] text-[#181700]">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[#181700] sm:text-lg">
              Jadwal Terapi Mendatang
            </h2>
            <p className="mt-0.5 text-xs font-semibold text-stone-500 sm:text-sm">
              {monthRangeLabel}
            </p>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center justify-between gap-2 lg:w-auto lg:justify-end">
          {selectedDate && (
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="cursor-pointer rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-[#181700] transition-colors hover:border-[var(--hafta-ylw-200)] hover:bg-[var(--hafta-ylw-100)]"
            >
              Reset ke Semua Jadwal
            </button>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setFilterOpen((open) => !open)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-600 transition-colors hover:bg-stone-50"
            >
              <Filter className="h-3.5 w-3.5" />
              Filter
            </button>
            {filterOpen && (
              <>
                <button
                  type="button"
                  aria-label="Tutup filter"
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setFilterOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-2 w-40 rounded-xl border border-stone-200 bg-white p-1.5 shadow-lg">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setStatusFilter(option.value);
                        setFilterOpen(false);
                      }}
                      className={cn(
                        'flex w-full cursor-pointer items-center justify-between rounded-full px-3 py-2 text-left text-xs font-medium transition-colors',
                        statusFilter === option.value
                          ? 'bg-stone-100 text-[#181700]'
                          : 'text-stone-600 hover:bg-stone-50'
                      )}
                    >
                      {option.label}
                      {statusFilter === option.value && <Check className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center rounded-full bg-stone-100 p-1">
            <button
              type="button"
              aria-label="Tampilan daftar"
              onClick={() => setView('list')}
              className={cn(
                'flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition-colors',
                view === 'list' ? 'bg-white text-[#181700] shadow-sm' : 'text-stone-500'
              )}
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label="Tampilan grid"
              onClick={() => setView('grid')}
              className={cn(
                'flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition-colors',
                view === 'grid' ? 'bg-white text-[#181700] shadow-sm' : 'text-stone-500'
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>

          {canCreate && (
            <NewAppointmentButton className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[var(--hafta-ylw-100)] px-4 py-2.5 text-xs font-bold text-[#181700] transition-all hover:bg-[var(--hafta-ylw-200)]">
              <Plus className="h-3.5 w-3.5" />
              Buat Jadwal
            </NewAppointmentButton>
          )}
        </div>
      </div>

      {/* Date strip */}
      <div className="my-6 flex w-full items-center justify-between gap-3 sm:gap-4">
        <button
          type="button"
          aria-label={`${visibleCount} hari sebelumnya`}
          onClick={() => setStripStart((date) => addDays(date, -visibleCount))}
          className="flex h-10 w-10 aspect-square shrink-0 cursor-pointer items-center justify-center rounded-full border border-stone-200/90 bg-white text-[#181700] shadow-2xs transition-all hover:border-[var(--hafta-ylw-200)] hover:bg-[var(--hafta-ylw-100)]"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="grid flex-1 grid-cols-5 items-center justify-items-center gap-1.5 sm:grid-cols-7 sm:gap-2 lg:grid-cols-10 xl:grid-cols-14">
          {stripDates.map((date) => {
            const dateKey = toDateKey(date);
            const isSelected = selectedDate === dateKey;
            const isFirstOfMonth = date.getDate() === 1;
            const isHoliday = date.getDay() === 0 || holidayDateSet.has(dateKey);
            const count = sessionsByDate.get(dateKey) ?? 0;
            const holidayName = holidayNameByDate.get(dateKey);
            const sessionLabel = count === 1 ? '1 sesi' : `${count} sesi`;

            return (
              <div key={dateKey} className="flex min-w-0 flex-col items-center">
                <span
                  aria-hidden={!isFirstOfMonth}
                  className={cn(
                    'flex h-3 items-center rounded-full px-1 text-[8px] font-bold leading-none',
                    isFirstOfMonth ? 'bg-stone-100 text-stone-500' : 'text-transparent'
                  )}
                >
                  {isFirstOfMonth ? MONTH_SHORT[date.getMonth()] : '•'}
                </span>

                <button
                  type="button"
                  title={
                    [holidayName, count > 0 ? sessionLabel : null].filter(Boolean).join(' · ') ||
                    undefined
                  }
                  aria-label={`${formatLongDate(dateKey)}${holidayName ? `, ${holidayName}` : ''}${
                    count > 0 ? `, ${sessionLabel}` : ''
                  }`}
                  onClick={() => setSelectedDate(dateKey)}
                  className={cn(
                    'relative mt-1 flex h-10 w-10 shrink-0 cursor-pointer select-none items-center justify-center rounded-full p-0 text-sm font-bold leading-none aspect-square transition-all duration-200 sm:h-11 sm:w-11',
                    isSelected
                      ? 'bg-[#181700] font-bold text-white shadow-md'
                      : isHoliday
                        ? 'border border-[var(--hafta-red-100)] bg-[var(--hafta-red-50)]/70 text-[var(--hafta-red-600)] hover:bg-[var(--hafta-red-100)]/80'
                        : count > 0
                          ? 'border-2 border-[var(--hafta-ylw-200)] bg-[var(--hafta-ylw-50)] font-extrabold text-[#181700] shadow-2xs hover:bg-[var(--hafta-ylw-100)]'
                          : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                  )}
                >
                  {date.getDate()}
                  {count > 0 && (
                    <span
                      className={cn(
                        'pointer-events-none absolute bottom-1.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full',
                        isSelected ? 'bg-[var(--hafta-ylw-100)]' : 'bg-[#181700]'
                      )}
                    />
                  )}
                  {count > 1 && (
                    <span className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#181700] px-1 text-[8px] font-bold leading-none text-white">
                      {count}
                    </span>
                  )}
                </button>

                <span
                  className={cn(
                    'mt-1 text-[10px] font-semibold',
                    isSelected
                      ? 'font-bold text-[#181700]'
                      : isHoliday
                        ? 'font-bold text-[var(--hafta-red-500)]'
                        : 'text-stone-400'
                  )}
                >
                  {DAY_LABELS[date.getDay()]}
                </span>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          aria-label={`${visibleCount} hari berikutnya`}
          onClick={() => setStripStart((date) => addDays(date, visibleCount))}
          className="flex h-10 w-10 aspect-square shrink-0 cursor-pointer items-center justify-center rounded-full border border-stone-200/90 bg-white text-[#181700] shadow-2xs transition-all hover:border-[var(--hafta-ylw-200)] hover:bg-[var(--hafta-ylw-100)]"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Appointment list */}
      {filteredAppointments.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-stone-200 bg-stone-50/60 px-5 py-8 text-center">
          <p className="text-sm font-semibold text-[#181700]">
            {selectedDate ? 'Belum ada jadwal pada tanggal ini' : 'Belum ada jadwal terapi mendatang'}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            {selectedDate ? formatLongDate(selectedDate) : 'Belum ada jadwal mendatang yang tercatat.'}
          </p>
          {selectedDate && (
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="mt-3 cursor-pointer rounded-full bg-stone-100 px-4 py-2 text-xs font-semibold text-[#181700] transition-colors hover:bg-[var(--hafta-ylw-100)]"
            >
              Reset ke Semua Jadwal
            </button>
          )}
        </div>
      ) : (
        <div
          className={cn(
            'mt-5',
            view === 'grid' ? 'grid gap-3 md:grid-cols-2' : 'space-y-3'
          )}
        >
          {filteredAppointments.map((appointment) => {
            const statusMeta = getStatusMeta(appointment.status);
            const StatusIcon = statusMeta.icon;
            const typeLabel = TYPE_LABELS[appointment.type] ?? appointment.type;
            const endTime = formatEndTime(appointment.startTime, appointment.durationMinutes);
            const phone = appointment.patientPhone?.replace(/\D/g, '');

            return (
              <div
                key={appointment.id}
                className="relative rounded-2xl border border-stone-200/60 bg-[#F8F8F6] p-4 transition-all hover:bg-[#F3F3EE] sm:px-6 sm:py-4"
              >
                <span
                  className={cn(
                    'absolute bottom-3 left-0 top-3 w-1.5 rounded-full',
                    statusMeta.accent
                  )}
                />

                <div className="flex flex-col gap-3 pl-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <div className="shrink-0 border-r border-stone-200/80 pr-4 sm:pr-6">
                      <p className="text-base font-bold text-[#181700] sm:text-lg">
                        {appointment.startTime}
                      </p>
                      <p className="text-xs font-medium text-stone-400">{endTime}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[#181700] sm:text-base">
                        {appointment.patientName}
                      </p>
                      <p className="mt-0.5 text-xs text-stone-500">{typeLabel}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
                        statusMeta.badge
                      )}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {statusMeta.label}
                    </span>

                    <div className="flex items-center gap-2">
                      {phone ? (
                        <a
                          href={`https://wa.me/${phone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Hubungi ${appointment.patientName}`}
                          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#181700] text-[var(--hafta-ylw-100)] transition-colors hover:bg-[var(--hafta-ylw-100)] hover:text-[#181700]"
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDetailAppointment(appointment)}
                          aria-label={`Lihat kontak ${appointment.patientName}`}
                          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#181700] text-[var(--hafta-ylw-100)] transition-colors hover:bg-[var(--hafta-ylw-100)] hover:text-[#181700]"
                        >
                          <Phone className="h-4 w-4" />
                        </button>
                      )}

                      <div className="relative">
                        <button
                          type="button"
                          aria-label="Menu opsi jadwal"
                          onClick={() =>
                            setMenuOpenId((current) =>
                              current === appointment.id ? null : appointment.id
                            )
                          }
                          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-stone-200/80 bg-white text-[#181700] transition-colors hover:bg-stone-100"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {menuOpenId === appointment.id && (
                          <>
                            <button
                              type="button"
                              aria-label="Tutup menu"
                              className="fixed inset-0 z-10 cursor-default"
                              onClick={() => setMenuOpenId(null)}
                            />
                            <div className="absolute bottom-full right-0 z-30 mb-2 w-56 origin-bottom-right rounded-2xl border border-stone-200 bg-white p-2 shadow-xl">
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuOpenId(null);
                                  setDetailAppointment(appointment);
                                }}
                                className="flex w-full cursor-pointer items-center rounded-full px-3 py-2 text-left text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50"
                              >
                                Lihat Detail
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuOpenId(null);
                                  setEvaluationAppointment(appointment);
                                }}
                                className="flex w-full cursor-pointer items-center rounded-full px-3 py-2 text-left text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50"
                              >
                                Evaluasi RM
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuOpenId(null);
                                  appointmentEditor.openEdit(appointment.id);
                                }}
                                className="flex w-full cursor-pointer items-center rounded-full px-3 py-2 text-left text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50"
                              >
                                Ubah Jadwal Terapi
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <GlobalSlideOver
        isOpen={detailAppointment !== null}
        onClose={() => setDetailAppointment(null)}
        title="Detail Jadwal"
        subtitle={detailAppointment?.patientName}
        icon={<CalendarDays className="h-5 w-5" />}
        size="md"
            footer={
          detailAppointment ? (
            <div className="shrink-0 bg-[#FEFEF6] py-4 flex flex-col gap-2.5 w-full">
              {/* Baris 1: Aksi utama (full width) */}
              <button
                type="button"
                onClick={() => {
                  setDetailAppointment(null);
                  setEvaluationAppointment(detailAppointment);
                }}
                className="w-full h-11 px-5 rounded-full bg-[var(--hafta-ylw-100)] hover:bg-[var(--hafta-ylw-200)] text-[#181700] font-bold text-xs sm:text-[13px] inline-flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-all whitespace-nowrap shrink-0"
              >
                <FileText className="h-4 w-4 shrink-0" />
                Mulai Evaluasi Rekam Medis
              </button>
              {/* Baris 2: Aksi pendukung (2 kolom simetris) */}
              <div className="grid grid-cols-2 gap-2.5 w-full">
                {canComplete &&
                (detailAppointment.status === 'SCHEDULED' ||
                  detailAppointment.status === 'CONFIRMED') ? (
                  <CompleteSessionButton
                    appointmentId={detailAppointment.id}
                    className="w-full h-10 px-4 rounded-full bg-white hover:bg-[var(--hafta-ylw-50)] hover:border-[var(--hafta-ylw-200)] text-[#181700] border border-stone-200/90 font-semibold text-xs sm:text-[13px] inline-flex items-center justify-center gap-2 cursor-pointer transition-all whitespace-nowrap shrink-0"
                  />
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    appointmentEditor.openEdit(detailAppointment.id);
                    setDetailAppointment(null);
                  }}
                  className="w-full h-10 px-4 rounded-full bg-white hover:bg-stone-100 text-[#181700] border border-stone-200/90 font-semibold text-xs sm:text-[13px] inline-flex items-center justify-center gap-2 cursor-pointer transition-all whitespace-nowrap shrink-0"
                >
                  <Pencil className="h-4 w-4 shrink-0" />
                  Ubah Jadwal
                </button>
              </div>
            </div>
          ) : undefined
        }
      >
        {detailAppointment ? (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-medium text-stone-500">
                Pasien
              </p>
              <p className="mt-1 text-base font-bold text-[#181700]">
                {detailAppointment.patientName}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-stone-500">
                  Tanggal
                </p>
                <p className="mt-1 text-sm font-medium text-[#181700]">
                  {formatLongDate(toDayKey(detailAppointment.scheduledDate))}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-stone-500">
                  Waktu
                </p>
                <p className="mt-1 text-sm font-medium text-[#181700]">
                  {detailAppointment.startTime} -{' '}
                  {formatEndTime(detailAppointment.startTime, detailAppointment.durationMinutes)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-stone-500">
                  Layanan
                </p>
                <p className="mt-1 text-sm font-medium text-[#181700]">
                  {TYPE_LABELS[detailAppointment.type] ?? detailAppointment.type}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-stone-500">
                  Durasi
                </p>
                <p className="mt-1 text-sm font-medium text-[#181700]">
                  {detailAppointment.durationMinutes} menit
                </p>
              </div>
            </div>

          </div>
        ) : null}
      </GlobalSlideOver>

      <AppointmentEditDrawer
        isOpen={appointmentEditor.isOpen}
        isLoading={appointmentEditor.isLoading}
        data={appointmentEditor.data}
        onClose={appointmentEditor.closeEdit}
      />

      <MedicalRecordFormDrawer
        isOpen={evaluationAppointment !== null}
        onClose={() => setEvaluationAppointment(null)}
        defaultPatientId={evaluationAppointment?.patientId}
        defaultAppointmentId={evaluationAppointment?.id}
        patientOptions={
          evaluationAppointment
            ? [{ id: evaluationAppointment.patientId, label: evaluationAppointment.patientName }]
            : []
        }
      />
    </section>
  );
}
