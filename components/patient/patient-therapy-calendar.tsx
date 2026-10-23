'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  UserRound,
} from 'lucide-react';
import { GlobalSlideOver } from '@/components/ui/global-slide-over';
import { useToast } from '@/components/ui/toast';
import {
  cancelPatientAppointmentRequest,
  requestPatientAppointment,
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

export function PatientTherapyCalendar({
  appointments,
  availability,
  requests,
  holidays,
  defaultDate,
}: {
  appointments: PatientPortalAppointment[];
  availability: AvailabilityDate[];
  requests: PatientAppointmentRequestView[];
  holidays: IndonesianHoliday[];
  defaultDate?: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const initialDate = defaultDate ? parseDateKey(defaultDate) : new Date();
  const [month, setMonth] = useState(() => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(defaultDate ?? null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedTherapistId, setSelectedTherapistId] = useState<string | null>(null);
  const [rescheduleAppointmentId, setRescheduleAppointmentId] = useState<string | null>(null);
  const [detailAppointment, setDetailAppointment] = useState<PatientPortalAppointment | null>(null);
  const todayKey = dateKey(new Date());

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
  const selectedRequests = selectedDate
    ? (requestsByDate.get(selectedDate) ?? []).filter((request) => request.status === 'PENDING')
    : [];
  const availableTimes = useMemo(
    () => Array.from(new Set((selectedAvailability?.slots ?? []).map((slot) => slot.startTime))).sort(),
    [selectedAvailability],
  );
  const effectiveTime = selectedTime && availableTimes.includes(selectedTime) ? selectedTime : availableTimes[0] ?? null;
  const therapistsForTime = (selectedAvailability?.slots ?? []).filter(
    (slot) => slot.startTime === effectiveTime,
  );
  const effectiveTherapist =
    therapistsForTime.find((slot) => slot.therapistId === selectedTherapistId) ?? therapistsForTime[0] ?? null;

  const smartAlternatives = useMemo(() => {
    const base = selectedDate ?? todayKey;
    return availability
      .filter((item) => item.date > base)
      .slice(0, 3)
      .map((item) => ({ date: item.date, slot: item.slots[0] }));
  }, [availability, selectedDate, todayKey]);

  function changeMonth(offset: number) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedTherapistId(null);
    setRescheduleAppointmentId(null);
  }

  function selectDate(key: string) {
    setSelectedDate(key);
    setSelectedTime(null);
    setSelectedTherapistId(null);
    const day = parseDateKey(key);
    setMonth(new Date(day.getFullYear(), day.getMonth(), 1));
  }

  function selectAlternative(key: string, time: string, therapistId: string) {
    selectDate(key);
    setSelectedTime(time);
    setSelectedTherapistId(therapistId);
    setTimeout(() => {
      document.getElementById('patient-slot-panel')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
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

  function submitRequest() {
    if (!selectedDate || !effectiveTherapist || !effectiveTime) return;

    startTransition(async () => {
      try {
        await requestPatientAppointment({
          requestedDate: selectedDate,
          startTime: effectiveTime,
          therapistId: effectiveTherapist.therapistId,
          durationMinutes: 60,
          rescheduleAppointmentId: rescheduleAppointmentId ?? undefined,
        });
        showToast(
          'success',
          rescheduleAppointmentId
            ? 'Pengajuan ubah jadwal terkirim. Tim Hafta akan mengonfirmasi.'
            : 'Pengajuan jadwal terkirim. Tim Hafta akan mengonfirmasi.',
        );
        setRescheduleAppointmentId(null);
        setDetailAppointment(null);
        router.refresh();
      } catch (error) {
        showToast('error', error instanceof Error ? error.message : 'Pengajuan jadwal tidak dapat dikirim.');
      }
    });
  }

  const panelContent = (() => {
    if (!selectedDate) {
      return (
        <div className="flex min-h-48 flex-col items-center justify-center px-4 text-center">
          <CalendarDays className="h-8 w-8 text-stone-300" />
          <p className="mt-3 text-sm font-semibold text-[#181700]">Pilih tanggal</p>
          <p className="mt-1 max-w-xs text-xs leading-relaxed text-stone-500">
            Tanggal dengan lingkaran kuning memiliki slot fisioterapis yang masih tersedia.
          </p>
        </div>
      );
    }

    if (selectedAppointments.length > 0 && !rescheduleAppointmentId) {
      return (
        <div className="space-y-4">
          <div>
            <p className="text-xs text-stone-500">Jadwal sesi Anda</p>
            <h3 className="mt-1 text-base font-bold text-[#181700]">{formatLongDate(selectedDate)}</h3>
          </div>
          {selectedAppointments.map((appointment) => (
            <article key={appointment.id} className="rounded-2xl bg-[#181700] p-4 text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">{TYPE_LABELS[appointment.type] ?? appointment.type}</p>
                  <p className="mt-1 text-xs text-stone-300">
                    {appointment.startTime} · {appointment.durationMinutes} menit
                  </p>
                </div>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-[var(--hafta-ylw-100)]">
                  {STATUS_LABELS[appointment.status] ?? appointment.status}
                </span>
              </div>
              <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-3 text-xs text-stone-300">
                <UserRound className="h-4 w-4 text-[var(--hafta-ylw-100)]" />
                {appointment.therapistName ?? 'Fisioterapis Hafta'}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDetailAppointment(appointment)}
                  className="h-9 cursor-pointer rounded-full border border-white/20 bg-white/5 px-3 text-xs font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Lihat Detail
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRescheduleAppointmentId(appointment.id);
                    setSelectedTime(null);
                    setSelectedTherapistId(null);
                  }}
                  className="h-9 cursor-pointer rounded-full bg-[var(--hafta-ylw-100)] px-3 text-xs font-bold text-[#181700] transition-colors hover:bg-[var(--hafta-ylw-200)]"
                >
                  Ajukan Ubah Jadwal
                </button>
              </div>
            </article>
          ))}
        </div>
      );
    }

    if (selectedAvailability && selectedAvailability.slots.length > 0) {
      return (
        <div className="space-y-4">
          <div>
            <p className="text-xs text-stone-500">{rescheduleAppointmentId ? 'Pilih jadwal pengganti' : 'Cari jadwal baru'}</p>
            <h3 className="mt-1 text-base font-bold text-[#181700]">{formatLongDate(selectedDate)}</h3>
            {rescheduleAppointmentId ? (
              <button
                type="button"
                onClick={() => setRescheduleAppointmentId(null)}
                className="mt-2 cursor-pointer text-xs font-semibold text-stone-500 underline underline-offset-4 hover:text-[#181700]"
              >
                Batalkan pengajuan ubah jadwal
              </button>
            ) : null}
          </div>

          <div>
            <p className="text-xs font-semibold text-[#181700]">Jam tersedia</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {availableTimes.map((time) => {
                const slots = selectedAvailability.slots.filter((slot) => slot.startTime === time);
                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => {
                      setSelectedTime(time);
                      setSelectedTherapistId(slots[0]?.therapistId ?? null);
                    }}
                    className={cn(
                      'h-10 cursor-pointer rounded-full border px-3.5 text-xs font-semibold transition-colors',
                      effectiveTime === time
                        ? 'border-[#181700] bg-[#181700] text-white'
                        : 'border-stone-200 bg-white text-[#181700] hover:bg-[var(--hafta-ylw-50)]/50',
                    )}
                  >
                    {time}–{slots[0]?.endTime}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-[#181700]">Fisioterapis</p>
            <div className="mt-2 space-y-2">
              {therapistsForTime.map((slot) => (
                <button
                  key={`${slot.startTime}-${slot.therapistId}`}
                  type="button"
                  onClick={() => setSelectedTherapistId(slot.therapistId)}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors',
                    effectiveTherapist?.therapistId === slot.therapistId
                      ? 'border-[var(--hafta-ylw-300)] bg-[var(--hafta-ylw-50)]/45'
                      : 'border-stone-200 bg-white hover:bg-stone-50',
                  )}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#181700] ring-1 ring-stone-200">
                    <UserRound className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold text-[#181700]">{slot.therapistName}</span>
                    <span className="block text-[11px] text-stone-500">{slot.startTime}–{slot.endTime}</span>
                  </span>
                  {effectiveTherapist?.therapistId === slot.therapistId ? (
                    <CheckCircle2 className="h-4 w-4 text-[var(--hafta-grn-600)]" />
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          {selectedRequests.length > 0 ? (
            <div className="space-y-2 rounded-xl bg-[var(--hafta-ylw-50)]/45 px-3.5 py-2.5 text-xs leading-relaxed text-[#181700]">
              <p>Anda sudah memiliki pengajuan menunggu konfirmasi pada tanggal ini.</p>
              {selectedRequests.map((request) => (
                <button
                  key={request.id}
                  type="button"
                  disabled={pending}
                  onClick={() => cancelPendingRequest(request.id)}
                  className="font-semibold underline underline-offset-4 disabled:opacity-60"
                >
                  Batalkan pengajuan {request.startTime}
                </button>
              ))}
            </div>
          ) : null}

          <button
            type="button"
            onClick={submitRequest}
            disabled={pending || !effectiveTherapist || selectedRequests.length > 0}
            className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--hafta-ylw-100)] px-4 text-xs font-bold text-[#181700] transition-colors hover:bg-[var(--hafta-ylw-200)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {pending ? 'Mengirim pengajuan...' : 'Pilih & Ajukan Jadwal Ini'}
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div>
          <p className="text-xs text-stone-500">Tanggal dipilih</p>
          <h3 className="mt-1 text-base font-bold text-[#181700]">{formatLongDate(selectedDate)}</h3>
        </div>
        <p className="rounded-2xl bg-stone-50 px-4 py-3 text-xs leading-relaxed text-stone-600">
          Maaf, slot pada tanggal ini sudah penuh atau klinik sedang libur. Berikut jadwal kosong terdekat yang tersedia untuk Anda.
        </p>
        {selectedRequests.length > 0 ? (
          <div className="space-y-2 rounded-xl bg-[var(--hafta-ylw-50)]/45 px-3.5 py-2.5 text-xs text-[#181700]">
            <p>Ada pengajuan jadwal yang masih menunggu konfirmasi pada tanggal ini.</p>
            {selectedRequests.map((request) => (
              <button
                key={request.id}
                type="button"
                disabled={pending}
                onClick={() => cancelPendingRequest(request.id)}
                className="block font-semibold underline underline-offset-4 disabled:opacity-60"
              >
                Batalkan pengajuan {request.startTime}
              </button>
            ))}
          </div>
        ) : null}
        <div className="space-y-2">
          {smartAlternatives.length > 0 ? (
            smartAlternatives.map((alternative) => (
              <button
                key={`${alternative.date}-${alternative.slot.startTime}`}
                type="button"
                onClick={() => selectAlternative(alternative.date, alternative.slot.startTime, alternative.slot.therapistId)}
                className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-left transition-colors hover:border-[var(--hafta-ylw-300)] hover:bg-[var(--hafta-ylw-50)]/30"
              >
                <span>
                  <span className="block text-xs font-bold text-[#181700]">{formatShortDate(alternative.date)}</span>
                  <span className="mt-0.5 block text-[11px] text-stone-500">{alternative.slot.therapistName}</span>
                </span>
                <span className="rounded-full bg-[var(--hafta-ylw-50)] px-3 py-1 text-xs font-bold text-[#181700]">
                  {alternative.slot.startTime}
                </span>
              </button>
            ))
          ) : (
            <p className="text-xs text-stone-400">Belum ada slot lain dalam periode ini.</p>
          )}
        </div>
      </div>
    );
  })();

  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-[#181700]">Kalender & Slot Terapi</h2>
          <p className="mt-1 text-xs leading-relaxed text-stone-500">
            Pilih tanggal untuk melihat sesi Anda atau mengajukan jadwal baru.
          </p>
        </div>
        <div className="flex items-center justify-between gap-1 rounded-full border border-stone-200 bg-white p-1 sm:justify-start">
          <button
            type="button"
            aria-label="Bulan sebelumnya"
            onClick={() => changeMonth(-1)}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#181700] transition-colors hover:bg-stone-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="min-w-32 text-center text-xs font-bold text-[#181700] sm:text-sm">
            {MONTHS[month.getMonth()]} {month.getFullYear()}
          </p>
          <button
            type="button"
            aria-label="Bulan berikutnya"
            onClick={() => changeMonth(1)}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#181700] transition-colors hover:bg-stone-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      {availability.length === 0 ? (
        <div className="rounded-2xl bg-[var(--hafta-ylw-50)]/45 px-4 py-3 text-xs leading-relaxed text-[#181700]">
          Belum ada slot tersedia. Fisioterapis Anda mungkin belum terhubung atau jadwal kerjanya belum diatur. Silakan hubungi tim Hafta untuk penjadwalan.
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="min-w-0">
          <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-stone-400">
            {WEEKDAYS.map((label) => (
              <span key={label} className="py-1.5">{label}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (!day) return <span key={`empty-${index}`} className="min-h-11" />;

              const key = dateKey(day);
              const isPast = key < todayKey;
              const holiday = holidayMap.get(key);
              const isSunday = day.getDay() === 0;
              const own = (appointmentsByDate.get(key) ?? []).filter((appointment) =>
                ['SCHEDULED', 'CONFIRMED', 'COMPLETED'].includes(appointment.status),
              );
              const slots = availabilityMap.get(key)?.slots ?? [];
              const pendingRequests = (requestsByDate.get(key) ?? []).filter((request) => request.status === 'PENDING');
              const isSelected = selectedDate === key;
              const unavailable = isPast || isSunday || Boolean(holiday);

              return (
                <button
                  type="button"
                  key={key}
                  title={holiday?.name ?? (isSunday ? 'Minggu' : undefined)}
                  onClick={() => selectDate(key)}
                  className="group flex min-h-11 w-full cursor-pointer items-center justify-center"
                >
                  <span
                    className={cn(
                      'relative mx-auto flex h-10 w-10 flex-col items-center justify-center rounded-full text-[13px] transition-all sm:h-11 sm:w-11',
                      own.length > 0
                        ? 'bg-[#181700] font-bold text-white'
                        : pendingRequests.length > 0
                          ? 'border border-[var(--hafta-ylw-300)] bg-[var(--hafta-ylw-100)] font-bold text-[#181700]'
                          : slots.length > 0 && !unavailable
                            ? 'border border-[var(--hafta-ylw-200)] bg-[var(--hafta-ylw-50)]/70 font-semibold text-[#181700] group-hover:bg-[var(--hafta-ylw-100)]'
                            : unavailable
                              ? isSunday || holiday
                                ? 'font-medium text-[var(--hafta-red-400)]'
                                : 'font-medium text-stone-300'
                              : 'font-medium text-stone-500 group-hover:bg-stone-100',
                      isSelected && 'ring-2 ring-[#181700] ring-offset-2 ring-offset-white',
                    )}
                  >
                    {day.getDate()}
                    {own.length > 0 ? (
                      <span className="mt-0.5 h-1 w-1 rounded-full bg-[var(--hafta-ylw-100)]" />
                    ) : slots.length > 0 && !unavailable ? (
                      <span className="mt-0.5 h-1 w-1 rounded-full bg-[var(--hafta-grn-500)]" />
                    ) : (
                      <span className="mt-0.5 h-1 w-1" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-stone-100 pt-3 text-[10px] text-stone-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#181700]" /> Sesi Anda
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border border-[var(--hafta-ylw-200)] bg-[var(--hafta-ylw-50)]" /> Slot tersedia
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--hafta-grn-500)]" /> Ada slot kosong
            </span>
          </div>
        </div>

        <aside id="patient-slot-panel" className="rounded-3xl bg-[#F7F7F5] p-4 sm:p-5">
          {panelContent}
        </aside>
      </div>

      <GlobalSlideOver
        isOpen={detailAppointment !== null}
        onClose={() => setDetailAppointment(null)}
        size="md"
        icon={<Clock3 className="h-5 w-5" />}
        title="Detail Sesi"
        subtitle={detailAppointment ? formatLongDate(dateKey(detailAppointment.scheduledDate)) : undefined}
        footer={
          detailAppointment ? (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDetailAppointment(null)}
                className="h-10 cursor-pointer rounded-full border border-stone-200 bg-white px-5 text-xs font-semibold text-stone-600"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  setRescheduleAppointmentId(detailAppointment.id);
                  setDetailAppointment(null);
                }}
                className="h-10 cursor-pointer rounded-full bg-[var(--hafta-ylw-100)] px-5 text-xs font-bold text-[#181700] hover:bg-[var(--hafta-ylw-200)]"
              >
                Ajukan Ubah Jadwal
              </button>
            </div>
          ) : null
        }
      >
        {detailAppointment ? (
          <dl className="space-y-4 text-sm">
            {[
              ['Jam', `${detailAppointment.startTime} · ${detailAppointment.durationMinutes} menit`],
              ['Fisioterapis', detailAppointment.therapistName ?? '-'],
              ['Jenis sesi', TYPE_LABELS[detailAppointment.type] ?? detailAppointment.type],
              ['Status', STATUS_LABELS[detailAppointment.status] ?? detailAppointment.status],
            ].map(([label, value]) => (
              <div key={label} className="border-b border-stone-100 pb-3">
                <dt className="text-xs text-stone-500">{label}</dt>
                <dd className="mt-1 font-semibold text-[#181700]">{value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </GlobalSlideOver>
    </section>
  );
}
