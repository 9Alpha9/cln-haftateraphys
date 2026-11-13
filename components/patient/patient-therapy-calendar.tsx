'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  CalendarDays,
  CalendarX2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  Plus,
  UserRound,
} from 'lucide-react';
import { GlobalSlideOver } from '@/components/ui/global-slide-over';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import {
  cancelPatientAppointmentRequest,
  requestPatientAppointment,
  reschedulePatientAppointment,
} from '@/server/actions/appointment-requests';
import type {
  AvailabilityDate,
  PatientAppointmentRequestView,
  PatientPortalAppointment,
} from '@/server/queries/patient-portal';
import type { IndonesianHoliday } from '@/server/queries/indonesian-holidays';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Terjadwal',
  CONFIRMED: 'Terkonfirmasi',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
  RESCHEDULED: 'Dijadwalkan ulang',
  NO_SHOW: 'Tidak hadir',
  PENDING: 'Menunggu konfirmasi',
  APPROVED: 'Disetujui',
  DECLINED: 'Belum disetujui',
};

function dateKey(value: Date | string) {
  if (typeof value === 'string') return value.slice(0, 10);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
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

function formatShortDate(key: string) {
  return parseDateKey(key).toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function formatSubmittedAt(value: Date | string) {
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

export function PatientTherapyCalendar({
  appointments,
  availability,
  requests,
  holidays = [],
  defaultDate,
  hideHeader = false,
}: {
  appointments: PatientPortalAppointment[];
  availability: AvailabilityDate[];
  requests: PatientAppointmentRequestView[];
  holidays?: IndonesianHoliday[];
  defaultDate?: string;
  hideHeader?: boolean;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const todayKey = dateKey(new Date());
  const initialDate = defaultDate ? parseDateKey(defaultDate) : new Date();
  const [month, setMonth] = useState(() => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(defaultDate ?? todayKey);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedTherapistId, setSelectedTherapistId] = useState<string | null>(null);
  const [reschedulingAppointment, setReschedulingAppointment] = useState<PatientPortalAppointment | null>(null);
  const [confirmingAppointment, setConfirmingAppointment] = useState<PatientPortalAppointment | null>(null);
  const [isDateDrawerOpen, setIsDateDrawerOpen] = useState(false);

  const availabilityMap = useMemo(
    () => new Map(availability.map((item) => [item.date, item])),
    [availability],
  );
  const holidayMap = useMemo(() => new Map(holidays.map((holiday) => [holiday.date, holiday])), [holidays]);
  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, PatientPortalAppointment[]>();
    for (const appointment of appointments) {
      const key = dateKey(appointment.scheduledDate);
      map.set(key, [...(map.get(key) ?? []), appointment]);
    }
    return map;
  }, [appointments]);
  const requestsByDate = useMemo(() => {
    const map = new Map<string, PatientAppointmentRequestView[]>();
    for (const request of requests) {
      const key = dateKey(request.requestedDate);
      map.set(key, [...(map.get(key) ?? []), request]);
    }
    return map;
  }, [requests]);

  const hasActiveSchedule = appointments.some(
    (appointment) =>
      ['SCHEDULED', 'CONFIRMED'].includes(appointment.status) &&
      dateKey(appointment.scheduledDate) >= todayKey,
  );
  const hasPendingRequest = requests.some((request) => request.status === 'PENDING');
  const showAvailability =
    reschedulingAppointment !== null || (!hasActiveSchedule && !hasPendingRequest);
  const requestMode: 'RESCHEDULE' | 'FIRST' = reschedulingAppointment ? 'RESCHEDULE' : 'FIRST';

  const days = useMemo(() => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const prefix = firstDay.getDay();
    return Array.from({ length: prefix + lastDay.getDate() }, (_, index) =>
      index < prefix ? null : new Date(month.getFullYear(), month.getMonth(), index - prefix + 1),
    );
  }, [month]);

  const selectedAvailability = selectedDate ? availabilityMap.get(selectedDate) : undefined;
  const selectedAppointments = selectedDate ? appointmentsByDate.get(selectedDate) ?? [] : [];
  const activeSelectedAppointments = selectedAppointments.filter(
    (appointment) =>
      ['SCHEDULED', 'CONFIRMED'].includes(appointment.status) &&
      dateKey(appointment.scheduledDate) >= todayKey,
  );
  const selectedRequests = selectedDate
    ? (requestsByDate.get(selectedDate) ?? []).filter((request) => request.status === 'PENDING')
    : [];
  const availableTimes = useMemo(
    () =>
      Array.from(
        new Set(
          (selectedAvailability?.slots ?? [])
            .filter((slot) => slot.isAvailable)
            .map((slot) => slot.startTime),
        ),
      ).sort(),
    [selectedAvailability],
  );
  const effectiveTime = selectedTime && availableTimes.includes(selectedTime) ? selectedTime : null;
  const therapistsForTime = (selectedAvailability?.slots ?? []).filter(
    (slot) => slot.startTime === effectiveTime && slot.isAvailable,
  );
  const currentTherapistSlot = reschedulingAppointment
    ? therapistsForTime.find((slot) => slot.therapistId === reschedulingAppointment.therapistId)
    : undefined;
  const effectiveTherapist =
    therapistsForTime.find((slot) => slot.therapistId === selectedTherapistId) ??
    currentTherapistSlot ??
    therapistsForTime[0] ??
    null;

  const selectedActiveAppointment = activeSelectedAppointments[0] ?? null;
  const pendingRescheduleForSelected = selectedActiveAppointment
    ? requests.find(
        (request) =>
          request.status === 'PENDING' &&
          request.rescheduleAppointmentId === selectedActiveAppointment.id,
      ) ?? null
    : null;

  const availabilityHint =
    requestMode === 'RESCHEDULE'
      ? 'Pilih slot waktu untuk memindahkan sesi Anda ke tanggal ini.'
      : 'Pilih slot waktu di bawah untuk mengajukan jadwal baru.';
  const submitLabel = requestMode === 'RESCHEDULE' ? 'Ajukan Perubahan Jadwal' : 'Ajukan Jadwal';

  function changeMonth(offset: number) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedTherapistId(null);
  }

  function selectDate(key: string) {
    setSelectedDate(key);
    setSelectedTime(null);
    setSelectedTherapistId(null);
    setIsDateDrawerOpen(true);
    const day = parseDateKey(key);
    setMonth(new Date(day.getFullYear(), day.getMonth(), 1));
  }

  function confirmReschedule() {
    if (!confirmingAppointment) return;
    setReschedulingAppointment(confirmingAppointment);
    setConfirmingAppointment(null);
    setSelectedTime(null);
    setSelectedTherapistId(null);
    // Tutup panel detail agar kalender dengan tanggal tersedia langsung terlihat.
    setIsDateDrawerOpen(false);
  }

  function cancelReschedule() {
    setReschedulingAppointment(null);
    setSelectedTime(null);
    setSelectedTherapistId(null);
  }

  function goToToday() {
    const today = new Date();
    setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(todayKey);
    setSelectedTime(null);
    setSelectedTherapistId(null);
  }

  function cancelPendingRequest(requestId: string) {
    startTransition(async () => {
      try {
        await cancelPatientAppointmentRequest(requestId);
        showToast('success', 'Pengajuan jadwal dibatalkan.');
        router.refresh();
      } catch (error) {
        showToast('error', error instanceof Error ? error.message : 'Pengajuan tidak dapat dibatalkan.');
      }
    });
  }

  function selectTimeSlot(time: string) {
    const slots = (selectedAvailability?.slots ?? []).filter((slot) => slot.startTime === time);
    const preferredTherapist = reschedulingAppointment
      ? slots.find((slot) => slot.therapistId === reschedulingAppointment.therapistId) ?? slots[0]
      : slots[0];
    setSelectedTime(time);
    setSelectedTherapistId(preferredTherapist?.therapistId ?? null);
  }

  function submitRequest() {
    if (!selectedDate || !effectiveTherapist || !effectiveTime) return;

    startTransition(async () => {
      try {
        if (reschedulingAppointment) {
          await reschedulePatientAppointment({
            appointmentId: reschedulingAppointment.id,
            requestedDate: selectedDate,
            startTime: effectiveTime,
            therapistId: effectiveTherapist.therapistId,
          });
          showToast(
            'success',
            'Pengajuan ubah jadwal berhasil dikirim. Menunggu konfirmasi dari fisioterapis.',
          );
          setReschedulingAppointment(null);
        } else {
          await requestPatientAppointment({
            requestedDate: selectedDate,
            startTime: effectiveTime,
            therapistId: effectiveTherapist.therapistId,
            durationMinutes: 60,
          });
          showToast('success', 'Pengajuan jadwal terkirim. Tim Hafta akan mengonfirmasi.');
          setIsDateDrawerOpen(false);
        }
        setSelectedTime(null);
        setSelectedTherapistId(null);
        setSelectedDate(selectedDate);
        router.refresh();
      } catch (error) {
        showToast('error', error instanceof Error ? error.message : 'Pengajuan jadwal tidak dapat dikirim.');
      }
    });
  }

  return (
    <section className="space-y-4 sm:space-y-5">
      <header className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', hideHeader && 'sm:justify-end')}>
        {!hideHeader ? (
          <div>
            <h2 className="text-base font-bold text-[#181700]">Kalender & Slot Terapi</h2>
            <p className="mt-1 text-xs leading-relaxed text-stone-500">
              {reschedulingAppointment
                ? 'Pilih tanggal dan jam baru untuk memindahkan sesi Anda.'
                : 'Pilih tanggal untuk melihat sesi Anda, mengajukan jadwal baru, atau mengubah jadwal.'}
            </p>
          </div>
        ) : null}
        <div className="flex w-full min-w-0 items-center gap-1 rounded-full border border-stone-200 bg-white p-1 sm:w-auto sm:justify-start">
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
      </header>

      {reschedulingAppointment ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-[var(--hafta-org-200)] bg-[var(--hafta-org-50)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium leading-relaxed text-[#181700]">
            Pilih tanggal berwarna kuning di kalender untuk memindahkan jadwal sesi Anda.
          </p>
          <button
            type="button"
            onClick={cancelReschedule}
            className="shrink-0 cursor-pointer rounded-full border border-[var(--hafta-org-300)] bg-white px-3 py-1.5 text-xs font-bold text-[#181700] transition-colors hover:bg-[var(--hafta-org-100)]"
          >
            Batal Ubah
          </button>
        </div>
      ) : null}

      {showAvailability && availability.length === 0 ? (
        <div className="rounded-2xl bg-[var(--hafta-org-50)]/45 px-4 py-3 text-xs leading-relaxed text-[#181700]">
          Belum ada jadwal terapis yang tersedia saat ini. Silakan muat ulang halaman beberapa
          saat lagi.
        </div>
      ) : null}

      <div>
        <div className="mx-auto grid w-full max-w-[460px] grid-cols-7 text-center text-[11px] font-semibold uppercase tracking-wide text-stone-400 sm:max-w-[560px] lg:max-w-none">
            {WEEKDAYS.map((label) => (
              <span key={label} className="py-2">{label}</span>
            ))}
          </div>
          <div className="mx-auto mt-1 grid w-full max-w-[460px] grid-cols-7 gap-1.5 sm:max-w-[560px] sm:gap-2 lg:max-w-none lg:gap-2.5">
            {days.map((day, index) => {
              if (!day) return <span key={`empty-${index}`} className="min-h-11" />;

              const key = dateKey(day);
               const isPast = key < todayKey;
              const holiday = holidayMap.get(key);
              const isSunday = day.getDay() === 0;
              const own = (appointmentsByDate.get(key) ?? []).filter((appointment) =>
                ['SCHEDULED', 'CONFIRMED', 'COMPLETED'].includes(appointment.status),
              );
              const slots = showAvailability ? availabilityMap.get(key)?.slots ?? [] : [];
              const availableSlots = slots.filter((slot) => slot.isAvailable);
              const pendingRequests = (requestsByDate.get(key) ?? []).filter((request) => request.status === 'PENDING');
              const isSelected = selectedDate === key;
              const isToday = key === todayKey;
              const isFullDay =
                showAvailability &&
                !isPast &&
                !isSunday &&
                !holiday &&
                slots.length > 0 &&
                availableSlots.length === 0;
              const unavailable = isPast || isSunday || Boolean(holiday) || isFullDay;
              const isHoliday = Boolean(holiday);
              const isDateSelectable = !(isFullDay && own.length === 0 && pendingRequests.length === 0);

              return (
                <button
                  type="button"
                  key={key}
                  title={
                    holiday?.name ??
                    (isSunday
                      ? 'Minggu'
                      : isFullDay
                        ? 'Semua slot pada tanggal ini sudah penuh'
                        : isToday
                          ? 'Hari ini'
                          : undefined)
                  }
                  disabled={!isDateSelectable}
                  onClick={() => selectDate(key)}
                  className={cn(
                    'flex min-h-[58px] w-full flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2 text-sm font-bold transition-all lg:min-h-[76px]',
                    isDateSelectable ? 'cursor-pointer' : 'cursor-not-allowed',
                    own.length > 0
                      ? 'border-[#181700] bg-[#181700] text-white'
                      : pendingRequests.length > 0
                        ? 'border-2 border-dashed border-[var(--hafta-org-400)] bg-[var(--hafta-org-50)] text-[#181700]'
                        : isFullDay
                          ? 'border-red-200 bg-red-50 text-red-700'
                          : availableSlots.length > 0 && !unavailable
                            ? 'border-[var(--hafta-org-200)] bg-[var(--hafta-org-50)]/70 text-[#181700]'
                            : unavailable
                              ? isSunday || holiday
                                ? 'border-transparent text-[var(--hafta-red-400)]'
                                : 'border-transparent text-stone-300'
                              : 'border-transparent text-stone-600 hover:bg-stone-50',
                    isToday && !isSelected && 'ring-1 ring-[#181700]/25',
                    isSelected && 'ring-2 ring-[#181700] ring-offset-2 ring-offset-white',
                  )}
                >
                  <span className="leading-none">{day.getDate()}</span>
                  {own.length > 0 ? (
                    <span className="flex max-w-full items-center justify-center gap-0.5">
                      {own.slice(0, 4).map((_, dotIndex) => (
                        <span
                          key={dotIndex}
                          className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--hafta-org-100)]"
                        />
                      ))}
                      {own.length > 4 ? (
                        <span className="text-[8px] font-bold leading-none text-[var(--hafta-org-100)]">
                          +{own.length - 4}
                        </span>
                      ) : null}
                    </span>
                  ) : pendingRequests.length > 0 ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--hafta-org-400)]" />
                  ) : availableSlots.length > 0 && !unavailable ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--hafta-grn-500)]" />
                  ) : isFullDay ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-transparent" />
                  )}
                  {own.length > 0 ? (
                    <span className="hidden max-w-full truncate text-[9px] font-semibold text-[var(--hafta-org-100)] lg:block">
                      {own.length} sesi
                    </span>
                  ) : isFullDay ? (
                    <span className="hidden text-[9px] font-semibold text-red-600 lg:block">Penuh</span>
                  ) : availableSlots.length > 0 && !unavailable ? (
                    <span className="hidden max-w-full truncate text-[9px] font-medium text-[#181700]/70 lg:block">
                      Tersedia
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-stone-100 pt-3 text-[10px] text-stone-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#181700]" /> Sesi Anda
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--hafta-red-400)]" /> Hari Libur / Minggu / Penuh
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border-2 border-dashed border-[var(--hafta-org-400)] bg-[var(--hafta-org-50)]" /> Menunggu konfirmasi
            </span>
            {showAvailability ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full border border-[var(--hafta-org-200)] bg-[var(--hafta-org-50)]" /> Slot tersedia
              </span>
            ) : null}
          </div>
      </div>

      <ConfirmDialog
        isOpen={confirmingAppointment !== null}
        title="Ingin Mengubah Jadwal Sesi Ini?"
        description={
          confirmingAppointment
            ? `Anda akan mengubah jadwal sesi pada ${formatLongDate(dateKey(confirmingAppointment.scheduledDate))} pukul ${confirmingAppointment.startTime}. Jika dilanjutkan, kalender akan menampilkan tanggal dan jam terapis yang tersedia untuk Anda pilih.`
            : undefined
        }
        confirmLabel="Ya, Pilih Tanggal Baru"
        cancelLabel="Batal"
        icon={<CalendarDays className="h-5 w-5" />}
        iconClassName="h-11 w-11 bg-[var(--hafta-org-100)] text-[#181700] sm:h-11 sm:w-11"
        panelClassName="rounded-3xl border border-stone-200/90 shadow-2xl"
        confirmClassName="rounded-full bg-[var(--hafta-org-100)] font-bold text-[#181700] hover:bg-[var(--hafta-org-200)] hover:opacity-100"
        cancelClassName="rounded-full border border-stone-200/90 bg-white font-semibold text-[#181700] hover:bg-stone-100 hover:text-[#181700]"
        onConfirm={confirmReschedule}
        onCancel={() => setConfirmingAppointment(null)}
      />

      <GlobalSlideOver
        isOpen={isDateDrawerOpen}
        onClose={() => {
          setIsDateDrawerOpen(false);
          setSelectedTime(null);
          setSelectedTherapistId(null);
        }}
        title="Detail Tanggal & Jadwal"
        subtitle={selectedDate ? formatLongDate(selectedDate) : undefined}
        icon={<CalendarDays className="h-5 w-5 text-[#181700]" />}
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
            {selectedDate && reschedulingAppointment && (
              <button
                type="button"
                onClick={submitRequest}
                disabled={pending || !effectiveTherapist}
                className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--hafta-org-100)] px-4 sm:px-5 text-xs font-bold text-[#181700] transition-colors hover:bg-[var(--hafta-org-200)] disabled:opacity-60"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {submitLabel}
              </button>
            )}
            {selectedDate &&
              !reschedulingAppointment &&
              showAvailability &&
              activeSelectedAppointments.length === 0 &&
              availableTimes.length > 0 && (
                <button
                  type="button"
                  onClick={submitRequest}
                  disabled={pending || !effectiveTherapist}
                  className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--hafta-org-100)] px-4 sm:px-5 text-xs font-bold text-[#181700] transition-colors hover:bg-[var(--hafta-org-200)] disabled:opacity-60"
                >
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {submitLabel}
                </button>
              )}
            {selectedDate && !reschedulingAppointment && activeSelectedAppointments.length > 0 && (
              pendingRescheduleForSelected ? (
                <p className="flex-1 text-[11px] leading-relaxed text-stone-500">
                  Perubahan jadwal sesi ini sedang menunggu konfirmasi fisioterapis. Batalkan pengajuan di atas bila
                  ingin memilih jadwal lain.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingAppointment(activeSelectedAppointments[0] ?? null)}
                  disabled={pending}
                  className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--hafta-org-100)] px-4 sm:px-5 text-xs font-bold text-[#181700] transition-colors hover:bg-[var(--hafta-org-200)] disabled:opacity-60"
                >
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Ubah Jadwal
                </button>
              )
            )}
            <button
              type="button"
              onClick={() => setIsDateDrawerOpen(false)}
              className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full border border-stone-200/90 bg-white px-4 sm:px-5 text-xs font-semibold text-[#181700] transition-colors hover:bg-stone-100 disabled:opacity-60"
            >
              Batal
            </button>
          </div>
        }
      >
          <div className="space-y-4">
            <div>
              <p className="text-xs text-stone-500">Tanggal dipilih</p>
              <h3 className="mt-1 text-base font-bold text-[#181700]">{selectedDate ? formatLongDate(selectedDate) : '-'}</h3>
            </div>
            {selectedRequests.length > 0 ? (
              <div className="space-y-2">
                {selectedRequests.map((request) => (
                  <div key={request.id} className="rounded-2xl border border-stone-200 bg-[#FAFAF8] p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#181700]">
                          <Clock3 className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-xs font-bold text-[#181700]">
                            {request.rescheduleFromDate ? 'Perubahan jadwal' : 'Jadwal terapi baru'}
                          </p>
                          <p className="text-[10px] text-stone-500">
                            Diajukan {formatSubmittedAt(request.createdAt)}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-stone-600">
                        Menunggu konfirmasi
                      </span>
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
                      <div>
                        <dt className="text-stone-400">Jadwal usulan</dt>
                        <dd className="font-semibold text-[#181700]">
                          {formatShortDate(request.requestedDate)} · {request.startTime}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-stone-400">Durasi</dt>
                        <dd className="font-semibold text-[#181700]">{request.durationMinutes} menit</dd>
                      </div>
                      <div>
                        <dt className="text-stone-400">Fisioterapis</dt>
                        <dd className="font-semibold text-[#181700]">
                          {request.therapistName ?? 'Fisioterapis Hafta'}
                        </dd>
                      </div>
                      {request.rescheduleFromDate ? (
                        <div>
                          <dt className="text-stone-400">Jadwal semula</dt>
                          <dd className="font-semibold text-[#181700]">
                            {formatShortDate(request.rescheduleFromDate)} ·{' '}
                            {request.rescheduleFromTime?.slice(0, 5) ?? '-'}
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => cancelPendingRequest(request.id)}
                      className="mt-3 inline-flex h-9 cursor-pointer items-center justify-center rounded-full border border-red-200 bg-white px-3 text-[11px] font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-60"
                    >
                      Batalkan pengajuan
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            {selectedDate ? (
              <div className="space-y-3">
                <p className="text-xs text-stone-500">Detail Sesi</p>
                {selectedAppointments.length > 0 ? (
                  selectedAppointments.map((appointment) => (
                    <div key={appointment.id} className="rounded-2xl bg-[#181700] p-3 text-white space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold">{appointment.startTime}</p>
                          <p className="mt-1 text-xs text-stone-300">
                            {appointment.durationMinutes} menit
                          </p>
                        </div>
                        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-[var(--hafta-org-100)]">
                          {STATUS_LABELS[appointment.status] ?? appointment.status}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 border-t border-white/10 pt-2 text-xs text-stone-300">
                        <UserRound className="h-4 w-4 text-[var(--hafta-org-100)]" />
                        {appointment.therapistName ?? 'Fisioterapis Hafta'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4 sm:py-6 text-center">
                    <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#FAFAF8] text-stone-400">
                      <CalendarX2 className="h-5 w-5" />
                    </span>
                    <p className="mt-2 text-sm font-semibold text-[#181700]">
                      Tidak ada sesi pada tanggal ini
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-stone-500">
                      {showAvailability
                        ? availabilityHint
                        : 'Pilih tanggal lain untuk melihat jadwal Anda.'}
                    </p>
                  </div>
                )}
              </div>
            ) : null}

            {selectedDate && showAvailability && selectedAppointments.length === 0 ? (
              <div className="space-y-2">
                {effectiveTime && effectiveTherapist ? (
                  <div className="rounded-2xl border border-stone-200 bg-[#FAFAF8] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">
                          Slot dipilih
                        </p>
                        <p className="mt-1 text-sm font-bold text-[#181700]">
                          {selectedDate ? formatLongDate(selectedDate) : ''}
                        </p>
                        <p className="mt-0.5 text-xs text-stone-600">
                          {effectiveTime}–{therapistsForTime[0]?.endTime ?? ''} · 60 menit
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTime(null);
                          setSelectedTherapistId(null);
                        }}
                        className="shrink-0 cursor-pointer rounded-full border border-stone-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-[#181700] transition-colors hover:bg-stone-50"
                      >
                        Ganti jam
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-stone-200 pt-2 text-xs text-stone-600">
                      <span className="text-stone-500">Fisioterapis:</span>
                      {therapistsForTime.length > 1 ? (
                        therapistsForTime.map((slot) => (
                          <button
                            key={slot.therapistId}
                            type="button"
                            onClick={() => setSelectedTherapistId(slot.therapistId)}
                            className={cn(
                              'cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors',
                              effectiveTherapist.therapistId === slot.therapistId
                                ? 'border-[#181700] bg-[#181700] text-white'
                                : 'border-stone-200 bg-white text-[#181700] hover:bg-stone-50',
                            )}
                          >
                            {slot.therapistName}
                          </button>
                        ))
                      ) : (
                        <span className="font-medium text-[#181700]">
                          {effectiveTherapist.therapistName}
                        </span>
                      )}
                    </div>
                    {reschedulingAppointment &&
                    effectiveTherapist.therapistId !== reschedulingAppointment.therapistId ? (
                      <div className="mt-2 flex items-start gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-[11px] leading-relaxed text-stone-700">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--hafta-org-500)]" />
                        <span>
                          Sesi ini akan ditangani <strong>{effectiveTherapist.therapistName}</strong>, bukan{' '}
                          {reschedulingAppointment.therapistName ?? 'fisioterapis sebelumnya'}. Pilih jam
                          lain bila ingin tetap dengan fisioterapis yang sama.
                        </span>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-stone-500">Jam tersedia</p>
                    <div className="grid grid-cols-2 gap-2">
                      {availableTimes.map((time) => {
                        const slots = (selectedAvailability?.slots ?? []).filter(
                          (slot) => slot.startTime === time && slot.isAvailable,
                        );
                        return (
                          <button
                            key={time}
                            type="button"
                            onClick={() => selectTimeSlot(time)}
                            className="flex cursor-pointer flex-col items-start gap-1 rounded-xl border border-stone-200 bg-white p-3 text-left transition-colors hover:border-[#181700] hover:bg-[#FAFAF8]"
                          >
                            <span className="flex w-full items-center justify-between gap-2">
                              <span className="text-sm font-bold text-[#181700]">
                                {time}–{slots[0]?.endTime}
                              </span>
                              <span className="h-4 w-4 shrink-0 rounded-full border border-stone-300" />
                            </span>
                            <span className="text-[10px] leading-tight text-stone-500">
                              60 menit · {slots[0]?.therapistName ?? 'Fisioterapis Hafta'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {availableTimes.length === 0 ? (
                      <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] leading-relaxed text-red-700">
                        Semua jam pada tanggal ini sudah penuh. Silakan pilih tanggal lain.
                      </p>
                    ) : null}
                  </>
                )}
              </div>
            ) : null}
          </div>
        </GlobalSlideOver>
    </section>
  );
}
