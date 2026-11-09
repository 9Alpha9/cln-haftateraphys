'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  UserRound,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { requestPatientAppointment } from '@/server/actions/appointment-requests';
import type { AvailabilityDate, AvailabilitySlot } from '@/server/queries/patient-portal';
import { cn } from '@/lib/utils';

const WEEKDAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

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

function StepBadge({ step }: { step: number }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#181700] text-[11px] font-extrabold text-white">
      {step}
    </span>
  );
}

export function PatientBookingPanel({ availability }: { availability: AvailabilityDate[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();

  const dateScrollRef = useRef<HTMLDivElement>(null);

  const datesWithSchedule = useMemo(
    () =>
      availability
        .filter((day) => day.slots.length > 0)
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date)),
    [availability],
  );

  const firstBookableDate = datesWithSchedule.find((day) =>
    day.slots.some((slot) => slot.isAvailable),
  );

  const [selectedDate, setSelectedDate] = useState<string | null>(
    () => firstBookableDate?.date ?? null,
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedTherapistId, setSelectedTherapistId] = useState<string | null>(null);

  const selectedDay = datesWithSchedule.find((day) => day.date === selectedDate);
  const timeGroups = useMemo(() => {
    const map = new Map<string, AvailabilitySlot[]>();
    for (const slot of selectedDay?.slots ?? []) {
      map.set(slot.startTime, [...(map.get(slot.startTime) ?? []), slot]);
    }
    return Array.from(map.entries())
      .map(([time, slots]) => ({
        time,
        slots,
        availableSlots: slots.filter((slot) => slot.isAvailable),
      }))
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [selectedDay]);
  const therapistsForTime: AvailabilitySlot[] = useMemo(
    () => (selectedDay?.slots ?? []).filter((slot) => slot.startTime === selectedTime && slot.isAvailable),
    [selectedDay, selectedTime],
  );
  const effectiveTherapist =
    therapistsForTime.find((slot) => slot.therapistId === selectedTherapistId) ??
    therapistsForTime[0] ??
    null;
  const hasBookableDate = Boolean(firstBookableDate);

  const canSubmit = Boolean(selectedDate && selectedTime && effectiveTherapist) && !pending;

  function scrollDates(direction: 'prev' | 'next') {
    const el = dateScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === 'next' ? el.clientWidth * 0.8 : -el.clientWidth * 0.8, behavior: 'smooth' });
  }

  function selectDate(key: string) {
    setSelectedDate(key);
    setSelectedTime(null);
    setSelectedTherapistId(null);
  }

  function selectTime(time: string) {
    const slots = (selectedDay?.slots ?? []).filter(
      (slot) => slot.startTime === time && slot.isAvailable,
    );
    setSelectedTime(time);
    setSelectedTherapistId(slots[0]?.therapistId ?? null);
  }

  function submitRequest() {
    if (!selectedDate || !selectedTime || !effectiveTherapist) return;

    startTransition(async () => {
      try {
        await requestPatientAppointment({
          requestedDate: selectedDate,
          startTime: selectedTime,
          therapistId: effectiveTherapist.therapistId,
          durationMinutes: 60,
        });
        showToast(
          'success',
          'Pengajuan jadwal terkirim. Tim Hafta akan mengonfirmasi jadwal Anda.',
        );
        setSelectedTime(null);
        setSelectedTherapistId(null);
        router.refresh();
      } catch (error) {
        showToast(
          'error',
          error instanceof Error ? error.message : 'Pengajuan jadwal tidak dapat dikirim.',
        );
      }
    });
  }

  if (datesWithSchedule.length === 0) {
    return (
      <section className="rounded-3xl border border-stone-200/90 bg-white p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--hafta-ylw-100)] text-[#181700]">
            <CalendarDays className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-[#181700]">Buat jadwal terapi</h2>
            <p className="mt-1 text-xs leading-relaxed text-stone-500">
              Jadwal terapis belum tersedia saat ini. Silakan muat ulang halaman beberapa saat lagi.
            </p>
            <button
              type="button"
              onClick={() => router.refresh()}
              className="mt-3 inline-flex h-10 cursor-pointer items-center justify-center rounded-full bg-[var(--hafta-ylw-100)] px-4 text-xs font-bold text-[#181700] transition-colors hover:bg-[var(--hafta-ylw-200)]"
            >
              Muat ulang jadwal
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="buat-jadwal"
      className="scroll-mt-24 rounded-3xl border border-stone-200/90 bg-white p-4 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--hafta-ylw-100)] text-[#181700]">
          <CalendarPlus className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-[#181700]">Buat jadwal terapi</h2>
          <p className="mt-1 text-xs leading-relaxed text-stone-500">
            Pilih tanggal, jam, dan fisioterapis langsung dari dashboard. Tim Hafta akan
            mengonfirmasi jadwal Anda.
          </p>
        </div>
      </div>

      {/* Step 1 — Tanggal */}
      <div className="mt-5">
        <div className="flex items-center gap-2">
          <StepBadge step={1} />
          <p className="text-xs font-bold text-[#181700]">Pilih tanggal</p>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-[10px] leading-relaxed text-stone-500">
            Geser untuk melihat tanggal lain. Tanggal <span className="font-semibold text-red-600">merah</span> sudah penuh.
          </p>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              aria-label="Lihat tanggal sebelumnya"
              onClick={() => scrollDates('prev')}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-stone-200 bg-white text-[#181700] transition-colors hover:bg-stone-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Lihat tanggal berikutnya"
              onClick={() => scrollDates('next')}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-stone-200 bg-white text-[#181700] transition-colors hover:bg-stone-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div
          ref={dateScrollRef}
          role="group"
          aria-label="Pilih tanggal terapi"
          className="-mx-4 mt-2 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {datesWithSchedule.map((day) => {
            const date = parseDateKey(day.date);
            const isSelected = day.date === selectedDate;
            const availableSlots = day.slots.filter((slot) => slot.isAvailable);
            const isFull = availableSlots.length === 0;
            const slotCount = new Set(availableSlots.map((slot) => slot.startTime)).size;
            return (
              <button
                key={day.date}
                type="button"
                aria-pressed={isSelected}
                aria-label={
                  isFull
                    ? `${formatLongDate(day.date)} sudah penuh, tidak bisa dipilih`
                    : `${formatLongDate(day.date)}, ${slotCount} jam tersedia`
                }
                title={isFull ? 'Semua slot pada tanggal ini sudah penuh' : undefined}
                disabled={isFull}
                onClick={() => selectDate(day.date)}
                className={cn(
                  'flex min-w-[68px] snap-start flex-col items-center justify-center gap-0.5 rounded-2xl border px-2.5 py-2.5 transition-colors',
                  isFull
                    ? 'cursor-not-allowed border-red-200 bg-red-50 text-red-700'
                    : 'cursor-pointer',
                  !isFull && isSelected
                    ? 'border-[#181700] bg-[#181700] text-white'
                    : !isFull
                      ? 'border-stone-200 bg-white text-[#181700] hover:bg-stone-50'
                      : null,
                )}
              >
                <span
                  className={cn(
                    'text-[10px] font-semibold uppercase tracking-wide',
                    isSelected ? 'text-white/70' : isFull ? 'text-red-500' : 'text-stone-400',
                  )}
                >
                  {WEEKDAYS_SHORT[date.getDay()]}
                </span>
                <span className="text-lg font-extrabold leading-none">{date.getDate()}</span>
                <span
                  className={cn(
                    'text-[10px] font-medium',
                    isSelected ? 'text-white/80' : isFull ? 'text-red-600' : 'text-stone-500',
                  )}
                >
                  {MONTHS_SHORT[date.getMonth()]}
                </span>
                <span
                  className={cn(
                    'mt-0.5 text-[9px] font-semibold',
                    isSelected
                      ? 'text-[var(--hafta-ylw-100)]'
                      : isFull
                        ? 'text-red-600'
                        : 'text-stone-400',
                  )}
                >
                  {isFull ? 'Penuh' : `${slotCount} slot`}
                </span>
              </button>
            );
          })}
        </div>
        {!hasBookableDate ? (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] leading-relaxed text-red-700">
            Semua tanggal pada rentang jadwal ini sudah penuh. Silakan muat ulang beberapa saat lagi.
          </p>
        ) : null}
      </div>

      {/* Step 2 — Jam */}
      <div className="mt-5">
        <div className="flex items-center gap-2">
          <StepBadge step={2} />
          <p className="text-xs font-bold text-[#181700]">Pilih jam</p>
        </div>
        {timeGroups.length > 0 ? (
          <div
            role="group"
            aria-label="Pilih jam terapi"
            className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3"
          >
            {timeGroups.map((group) => {
              const isFull = group.availableSlots.length === 0;
              const isSelected = group.time === selectedTime;
              return (
                <button
                  key={group.time}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={
                    isFull
                      ? `${group.time} sudah penuh, tidak bisa dipilih`
                      : `${group.time}, ${group.availableSlots.length} fisioterapis tersedia`
                  }
                  title={isFull ? 'Semua fisioterapis pada jam ini sudah terisi' : undefined}
                  disabled={isFull}
                  onClick={() => selectTime(group.time)}
                  className={cn(
                    'flex flex-col items-start gap-0.5 rounded-xl border px-3 py-2.5 text-left transition-colors',
                    isFull
                      ? 'cursor-not-allowed border-red-200 bg-red-50 text-red-700'
                      : 'cursor-pointer',
                    !isFull && isSelected
                      ? 'border-[#181700] bg-[#181700] text-white'
                      : !isFull
                        ? 'border-stone-200 bg-white text-[#181700] hover:bg-stone-50'
                        : null,
                  )}
                >
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold">
                    <Clock3 className="h-3.5 w-3.5" />
                    {group.time.slice(0, 5)}–{group.slots[0]?.endTime.slice(0, 5)}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] leading-tight',
                      isFull
                        ? 'font-semibold text-red-600'
                        : isSelected
                          ? 'text-white/70'
                          : 'text-stone-500',
                    )}
                  >
                    {isFull
                      ? 'Penuh · tidak bisa dipilih'
                      : `60 menit · ${group.availableSlots.length} terapis`}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 rounded-xl bg-[#FAFAF8] px-3 py-3 text-[11px] leading-relaxed text-stone-500">
            Pilih tanggal lain untuk melihat jam yang tersedia.
          </p>
        )}
      </div>

      {/* Step 3 — Terapis */}
      <div className="mt-5">
        <div className="flex items-center gap-2">
          <StepBadge step={3} />
          <p className="text-xs font-bold text-[#181700]">Pilih fisioterapis</p>
        </div>
        {therapistsForTime.length > 0 ? (
          <div
            role="group"
            aria-label="Pilih fisioterapis"
            className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2"
          >
            {therapistsForTime.map((slot) => {
              const isSelected = effectiveTherapist?.therapistId === slot.therapistId;
              return (
                <button
                  key={slot.therapistId}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedTherapistId(slot.therapistId)}
                  className={cn(
                    'flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors',
                    isSelected
                      ? 'border-[#181700] bg-[#FAFAF8]'
                      : 'border-stone-200 bg-white hover:bg-stone-50',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-extrabold',
                      isSelected
                        ? 'bg-[#181700] text-white'
                        : 'bg-[var(--hafta-ylw-100)] text-[#181700]',
                    )}
                  >
                    {slot.therapistName.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold text-[#181700]">
                      {slot.therapistName}
                    </span>
                    <span className="block text-[10px] text-stone-500">Fisioterapis Hafta</span>
                  </span>
                  {isSelected ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#181700]" />
                  ) : (
                    <UserRound className="h-4 w-4 shrink-0 text-stone-300" />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 rounded-xl bg-[#FAFAF8] px-3 py-3 text-[11px] leading-relaxed text-stone-500">
            Pilih jam terlebih dahulu untuk melihat fisioterapis yang tersedia.
          </p>
        )}
      </div>

      {/* Ringkasan & aksi */}
      <div className="mt-5 rounded-2xl bg-[#FAFAF8] p-3.5">
        {selectedDate && selectedTime && effectiveTherapist ? (
          <p className="text-[11px] leading-relaxed text-stone-600" aria-live="polite">
            <span className="font-bold text-[#181700]">Jadwal pilihan:</span>{' '}
            {formatLongDate(selectedDate)} · {selectedTime.slice(0, 5)} WIB ·{' '}
            {effectiveTherapist.therapistName}
          </p>
        ) : (
          <p className="text-[11px] leading-relaxed text-stone-500">
            Lengkapi tanggal, jam, dan fisioterapis untuk mengajukan jadwal.
          </p>
        )}
        <button
          type="button"
          onClick={submitRequest}
          disabled={!canSubmit}
          className="mt-3 inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--hafta-ylw-100)] px-4 text-xs font-bold text-[#181700] transition-colors hover:bg-[var(--hafta-ylw-200)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Mengirim pengajuan...
            </>
          ) : (
            <>
              <CalendarDays className="h-4 w-4" />
              Ajukan Jadwal
            </>
          )}
        </button>
      </div>
    </section>
  );
}
