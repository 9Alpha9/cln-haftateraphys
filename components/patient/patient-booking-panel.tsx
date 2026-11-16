'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  Search,
  UserRound,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import {
  requestPatientAppointment,
  reschedulePatientAppointment,
} from '@/server/actions/appointment-requests';
import type {
  AvailabilityDate,
  AvailabilitySlot,
  PatientPortalAppointment,
} from '@/server/queries/patient-portal';
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
  const datePart = key.slice(0, 10);
  const [year, month, day] = datePart.split('-').map(Number);
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
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--hafta-900)] text-[11px] font-extrabold text-white">
      {step}
    </span>
  );
}

export type PatientBookingPanelProps = {
  availability: AvailabilityDate[];
  mode?: 'CREATE' | 'RESCHEDULE';
  rescheduleAppointment?: PatientPortalAppointment | null;
  onRescheduleCancel?: () => void;
  onRequestSubmitted?: () => void;
};

export function PatientBookingPanel({
  availability,
  mode = 'CREATE',
  rescheduleAppointment = null,
  onRescheduleCancel,
  onRequestSubmitted,
}: PatientBookingPanelProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const dateScrollRef = useRef<HTMLDivElement>(null);

  const therapistOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; dates: Set<string> }>();
    for (const day of availability) {
      for (const slot of day.slots) {
        if (!slot.isAvailable) continue;
        const existing = map.get(slot.therapistId);
        if (existing) {
          existing.dates.add(day.date);
        } else {
          map.set(slot.therapistId, {
            id: slot.therapistId,
            name: slot.therapistName,
            dates: new Set([day.date]),
          });
        }
      }
    }
    return Array.from(map.values())
      .map((item) => ({ id: item.id, name: item.name, dateCount: item.dates.size }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [availability]);

  const initialTherapistId =
    mode === 'RESCHEDULE' &&
    rescheduleAppointment &&
    therapistOptions.some((therapist) => therapist.id === rescheduleAppointment.therapistId)
      ? rescheduleAppointment.therapistId
      : therapistOptions.length === 1
        ? therapistOptions[0]!.id
        : null;

  const [selectedTherapistId, setSelectedTherapistId] = useState<string | null>(
    initialTherapistId,
  );
  const [therapistQuery, setTherapistQuery] = useState('');
  const [showAllTherapists, setShowAllTherapists] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const selectedTherapist =
    therapistOptions.find((therapist) => therapist.id === selectedTherapistId) ?? null;

  const hasManyTherapists = therapistOptions.length > 6;
  const visibleTherapists = useMemo(() => {
    const query = therapistQuery.trim().toLowerCase();
    if (!query) return therapistOptions;
    return therapistOptions.filter((therapist) =>
      therapist.name.toLowerCase().includes(query),
    );
  }, [therapistOptions, therapistQuery]);

  const isSearchingTherapist = therapistQuery.trim().length > 0;
  const therapistPreviewLimit = 4;
  const displayedTherapists =
    isSearchingTherapist || showAllTherapists
      ? visibleTherapists
      : visibleTherapists.slice(0, therapistPreviewLimit);
  const hiddenTherapistCount = visibleTherapists.length - displayedTherapists.length;

  const datesForTherapist = useMemo(() => {
    if (!selectedTherapistId) return [];
    return availability
      .map((day) => ({
        date: day.date,
        slots: day.slots.filter((slot) => slot.therapistId === selectedTherapistId),
      }))
      .filter((day) => day.slots.length > 0)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [availability, selectedTherapistId]);

  const selectedDay = datesForTherapist.find((day) => day.date === selectedDate);
  const timeGroups = useMemo(() => {
    const map = new Map<string, AvailabilitySlot[]>();
    for (const slot of selectedDay?.slots ?? []) {
      map.set(slot.startTime, [...(map.get(slot.startTime) ?? []), slot]);
    }
    return Array.from(map.entries())
      .map(([time, slots]) => ({
        time,
        slots,
        available: slots.some((slot) => slot.isAvailable),
      }))
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [selectedDay]);

  const selectedSlot =
    selectedDay?.slots.find((slot) => slot.startTime === selectedTime && slot.isAvailable) ?? null;
  const hasBookableDate = datesForTherapist.some((day) =>
    day.slots.some((slot) => slot.isAvailable),
  );
  const canSubmit = Boolean(
    selectedTherapistId && selectedDate && selectedTime && selectedSlot,
  ) && !pending;

  function scrollDates(direction: 'prev' | 'next') {
    const el = dateScrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === 'next' ? el.clientWidth * 0.8 : -el.clientWidth * 0.8,
      behavior: 'smooth',
    });
  }

  function selectTherapist(therapistId: string) {
    setSelectedTherapistId(therapistId);
    setSelectedDate(null);
    setSelectedTime(null);
  }

  function selectDate(date: string) {
    setSelectedDate(date);
    setSelectedTime(null);
  }

  function submitRequest() {
    if (!selectedTherapistId || !selectedDate || !selectedTime || !selectedSlot) return;

    startTransition(async () => {
      try {
        if (mode === 'RESCHEDULE' && rescheduleAppointment) {
          await reschedulePatientAppointment({
            appointmentId: rescheduleAppointment.id,
            requestedDate: selectedDate,
            startTime: selectedTime,
            therapistId: selectedTherapistId,
          });
          showToast(
            'success',
            'Pengajuan perubahan jadwal terkirim. Menunggu konfirmasi dari fisioterapis.',
          );
        } else {
          await requestPatientAppointment({
            requestedDate: selectedDate,
            startTime: selectedTime,
            therapistId: selectedTherapistId,
            durationMinutes: 60,
          });
          showToast(
            'success',
            'Pengajuan jadwal terapi terkirim. Tim Hafta akan mengonfirmasi jadwal Anda.',
          );
        }

        setSelectedDate(null);
        setSelectedTime(null);
        onRequestSubmitted?.();
        router.refresh();
      } catch (error) {
        showToast(
          'error',
          error instanceof Error ? error.message : 'Pengajuan jadwal tidak dapat dikirim.',
        );
      }
    });
  }

  if (therapistOptions.length === 0) {
    return (
      <section className="rounded-3xl border border-border bg-card p-4 shadow-[0_8px_30px_rgba(24,23,0,0.05)] sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--hafta-org-100)] text-foreground">
            <CalendarDays className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-foreground">Jadwal Terapi Anda</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Jadwal fisioterapis belum tersedia saat ini. Silakan muat ulang halaman beberapa saat
              lagi.
            </p>
            <button
              type="button"
              onClick={() => router.refresh()}
              className="mt-3 inline-flex h-10 cursor-pointer items-center justify-center rounded-full bg-[var(--hafta-300)] px-4 text-xs font-bold text-foreground transition-colors hover:bg-[var(--hafta-400)] focus-visible:border-[var(--hafta-950)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35 "
            >
              Muat ulang jadwal
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-4 shadow-[0_8px_30px_rgba(24,23,0,0.05)] sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--hafta-org-100)] text-foreground">
          {mode === 'RESCHEDULE' ? (
            <CalendarDays className="h-5 w-5" />
          ) : (
            <CalendarPlus className="h-5 w-5" />
          )}
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-foreground">
            {mode === 'RESCHEDULE' ? 'Ubah Jadwal Terapi' : 'Jadwal Terapi Anda'}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {mode === 'RESCHEDULE'
              ? 'Pilih fisioterapis, tanggal, dan jam baru untuk sesi Anda.'
              : 'Pilih fisioterapis, tanggal, dan jam terapi yang tersedia.'}
          </p>
        </div>
      </div>

      {mode === 'RESCHEDULE' && rescheduleAppointment ? (
        <div className="mt-4 rounded-2xl border border-[var(--hafta-org-200)] bg-[var(--hafta-org-50)] px-3.5 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Jadwal saat ini
          </p>
          <p className="mt-1 text-xs font-bold text-foreground">
            {formatLongDate(rescheduleAppointment.scheduledDate)} ·{' '}
            {rescheduleAppointment.startTime.slice(0, 5)} WIB
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {rescheduleAppointment.therapistName ?? 'Fisioterapis Hafta'} ·{' '}
            {rescheduleAppointment.durationMinutes} menit
          </p>
        </div>
      ) : null}

      {/* Step 1 — Fisioterapis */}
      <div className="mt-5">
        <div className="flex flex-wrap items-center gap-2">
          <StepBadge step={1} />
          <p className="text-xs font-bold text-foreground">Pilih Fisioterapis</p>
          <span className="rounded-full bg-[#F4F4F1] px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {therapistOptions.length} tersedia
          </span>
        </div>

        {therapistOptions.length === 1 ? (
          <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-[var(--hafta-900)] bg-[#FAFAF8] px-3 py-2.5 ring-2 ring-[var(--hafta-org-200)]/35">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--hafta-900)] text-xs font-extrabold text-white">
              {therapistOptions[0]!.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-bold text-foreground">
                {therapistOptions[0]!.name}
              </span>
              <span className="block text-[10px] text-muted-foreground">
                {therapistOptions[0]!.dateCount} tanggal tersedia
              </span>
            </span>
            <CheckCircle2 className="h-4 w-4 shrink-0 text-foreground" />
          </div>
        ) : null}

        {therapistOptions.length > 1 ? (
          <>
        {hasManyTherapists ? (
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={therapistQuery}
              onChange={(event) => setTherapistQuery(event.target.value)}
              placeholder="Cari nama fisioterapis..."
              aria-label="Cari fisioterapis"
              className="h-9 w-full rounded-full border border-border bg-card pl-9 pr-3 text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-[var(--hafta-950)] focus:ring-4 focus:ring-[var(--hafta-org-200)]/35"
            />
          </div>
        ) : null}

        <div
          role="group"
          aria-label="Pilih fisioterapis"
          className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2"
        >
          {displayedTherapists.map((therapist) => {
            const isSelected = therapist.id === selectedTherapistId;
            return (
              <button
                key={therapist.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => selectTherapist(therapist.id)}
                className={cn(
                  'flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors focus-visible:border-[var(--hafta-950)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35 ',
                  isSelected
                    ? 'border-[var(--hafta-900)] bg-[#FAFAF8] ring-2 ring-[var(--hafta-org-200)]/35'
                    : 'border-border bg-card hover:bg-[var(--hafta-50)]',
                )}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-extrabold',
                    isSelected
                      ? 'bg-[var(--hafta-900)] text-white'
                      : 'bg-[var(--hafta-org-100)] text-foreground',
                  )}
                >
                  {therapist.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold text-foreground">
                    {therapist.name}
                  </span>
                  <span className="block text-[10px] text-muted-foreground">
                    {therapist.dateCount} tanggal tersedia
                  </span>
                </span>
                {isSelected ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-foreground" />
                ) : (
                  <UserRound className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                )}
              </button>
            );
          })}
          {visibleTherapists.length === 0 ? (
            <p className="col-span-full rounded-xl bg-[#FAFAF8] px-3 py-3 text-center text-[11px] text-muted-foreground">
              Fisioterapis tidak ditemukan. Coba kata kunci lain.
            </p>
          ) : null}
          {hiddenTherapistCount > 0 ? (
            <button
              type="button"
              onClick={() => setShowAllTherapists(true)}
              className="col-span-full mt-1 inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-transparent text-[11px] font-semibold text-muted-foreground transition-colors hover:border-stone-400 hover:bg-card hover:text-foreground"
            >
              Lihat {hiddenTherapistCount} fisioterapis lainnya
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          ) : null}
          {!isSearchingTherapist && showAllTherapists && visibleTherapists.length > therapistPreviewLimit ? (
            <button
              type="button"
              onClick={() => setShowAllTherapists(false)}
              className="col-span-full mt-1 inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-xl text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              Tampilkan lebih sedikit
              <ChevronDown className="h-3.5 w-3.5 rotate-180" />
            </button>
          ) : null}
        </div>
          </>
        ) : null}
      </div>

      {/* Step 2 — Tanggal */}
      <div className="mt-5">
        <div className="flex items-center gap-2">
          <StepBadge step={2} />
          <p className="text-xs font-bold text-foreground">Pilih Tanggal Terapi</p>
        </div>
        {!selectedTherapist ? (
          <p className="mt-3 rounded-xl bg-[#FAFAF8] px-3 py-3 text-[11px] leading-relaxed text-muted-foreground">
            Pilih fisioterapis terlebih dahulu untuk melihat tanggal yang tersedia.
          </p>
        ) : datesForTherapist.length === 0 ? (
          <p className="mt-3 rounded-xl bg-[#FAFAF8] px-3 py-3 text-[11px] leading-relaxed text-muted-foreground">
            Belum ada jadwal untuk fisioterapis ini. Silakan pilih fisioterapis lain.
          </p>
        ) : (
          <>
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                Geser untuk melihat tanggal lain. Tanggal{' '}
                <span className="font-semibold text-red-600">merah</span> sudah penuh.
              </p>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  aria-label="Lihat tanggal sebelumnya"
                  onClick={() => scrollDates('prev')}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-[var(--hafta-50)]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Lihat tanggal berikutnya"
                  onClick={() => scrollDates('next')}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-[var(--hafta-50)]"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div
              ref={dateScrollRef}
              role="group"
              aria-label="Pilih tanggal terapi"
              className="mt-2 flex snap-x snap-mandatory gap-3 overflow-x-auto pl-2 pr-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {datesForTherapist.map((day) => {
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
                      'flex min-w-[68px] snap-start flex-col items-center justify-center gap-0.5 rounded-2xl border px-2.5 py-2.5 transition-colors focus-visible:border-[var(--hafta-950)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35 ',
                      isFull
                        ? 'cursor-not-allowed border-red-200 bg-red-50 text-red-700'
                        : 'cursor-pointer',
                      !isFull && isSelected
                        ? 'border-[var(--hafta-900)] bg-[var(--hafta-900)] text-white'
                        : !isFull
                          ? 'border-border bg-card text-foreground hover:bg-[var(--hafta-50)]'
                          : null,
                    )}
                  >
                    <span
                      className={cn(
                        'text-[10px] font-semibold uppercase tracking-wide',
                        isSelected ? 'text-white/70' : isFull ? 'text-red-500' : 'text-muted-foreground',
                      )}
                    >
                      {WEEKDAYS_SHORT[date.getDay()]}
                    </span>
                    <span className="text-lg font-extrabold leading-none">{date.getDate()}</span>
                    <span
                      className={cn(
                        'text-[10px] font-medium',
                        isSelected ? 'text-white/80' : isFull ? 'text-red-600' : 'text-muted-foreground',
                      )}
                    >
                      {MONTHS_SHORT[date.getMonth()]}
                    </span>
                    <span
                      className={cn(
                        'mt-0.5 text-[9px] font-semibold',
                        isSelected
                          ? 'text-[var(--hafta-org-100)]'
                          : isFull
                            ? 'text-red-600'
                            : 'text-muted-foreground',
                      )}
                    >
                      {isFull ? 'Penuh' : `${slotCount} jam`}
                    </span>
                  </button>
                );
              })}
            </div>
            {!hasBookableDate ? (
              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] leading-relaxed text-red-700">
                Semua tanggal untuk fisioterapis ini sudah penuh. Silakan pilih fisioterapis lain.
              </p>
            ) : null}
          </>
        )}
      </div>

      {/* Step 3 — Jam */}
      <div className="mt-5">
        <div className="flex items-center gap-2">
          <StepBadge step={3} />
          <p className="text-xs font-bold text-foreground">Pilih Jam Terapi</p>
        </div>
        {!selectedDate ? (
          <p className="mt-3 rounded-xl bg-[#FAFAF8] px-3 py-3 text-[11px] leading-relaxed text-muted-foreground">
            Pilih tanggal terlebih dahulu untuk melihat jam yang tersedia.
          </p>
        ) : timeGroups.length === 0 ? (
          <p className="mt-3 rounded-xl bg-[#FAFAF8] px-3 py-3 text-[11px] leading-relaxed text-muted-foreground">
            Belum ada jam tersedia pada tanggal ini.
          </p>
        ) : (
          <div
            role="group"
            aria-label="Pilih jam terapi"
            className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3"
          >
            {timeGroups.map((group) => {
              const isSelected = group.time === selectedTime;
              return (
                <button
                  key={group.time}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={
                    group.available
                      ? `${group.time}, tersedia`
                      : `${group.time} sudah penuh, tidak bisa dipilih`
                  }
                  title={group.available ? undefined : 'Jam ini sudah penuh'}
                  disabled={!group.available}
                  onClick={() => setSelectedTime(group.time)}
                  className={cn(
                    'flex flex-col items-start gap-0.5 rounded-xl border px-3 py-2.5 text-left transition-colors focus-visible:border-[var(--hafta-950)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35 ',
                    !group.available
                      ? 'cursor-not-allowed border-red-200 bg-red-50 text-red-700'
                      : 'cursor-pointer',
                    group.available && isSelected
                      ? 'border-[var(--hafta-900)] bg-[var(--hafta-900)] text-white'
                      : group.available
                        ? 'border-border bg-card text-foreground hover:bg-[var(--hafta-50)]'
                        : null,
                  )}
                >
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold">
                    <Clock3 className="h-3.5 w-3.5" />
                    {group.time.slice(0, 5)}–{group.slots[0]?.endTime.slice(0, 5)} WIB
                  </span>
                  <span
                    className={cn(
                      'text-[10px] leading-tight',
                      !group.available
                        ? 'font-semibold text-red-600'
                        : isSelected
                          ? 'text-white/70'
                          : 'text-muted-foreground',
                    )}
                  >
                    {group.available ? 'Tersedia · 60 menit' : 'Penuh · tidak bisa dipilih'}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Ringkasan & aksi */}
      <div className="mt-5 rounded-2xl bg-[#FAFAF8] p-3.5">
        {selectedTherapist && selectedDate && selectedTime ? (
          <p className="text-[11px] leading-relaxed text-muted-foreground" aria-live="polite">
            <span className="font-bold text-foreground">Jadwal pilihan:</span>{' '}
            {selectedTherapist.name} · {formatLongDate(selectedDate)} ·{' '}
            {selectedTime.slice(0, 5)} WIB
          </p>
        ) : (
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Lengkapi fisioterapis, tanggal, dan jam untuk mengajukan jadwal.
          </p>
        )}
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={submitRequest}
            disabled={!canSubmit}
            className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--hafta-300)] px-6 text-sm font-bold text-foreground transition-colors hover:bg-[var(--hafta-400)] focus-visible:border-[var(--hafta-950)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Mengirim pengajuan...
              </>
            ) : (
              <>
                <CalendarDays className="h-4 w-4" />
                {mode === 'RESCHEDULE' ? 'Ajukan Perubahan Jadwal' : 'Ajukan Jadwal Terapi'}
              </>
            )}
          </button>
          {mode === 'RESCHEDULE' && onRescheduleCancel ? (
            <button
              type="button"
              onClick={onRescheduleCancel}
              disabled={pending}
              className="inline-flex h-11 cursor-pointer items-center justify-center rounded-full border border-border bg-card px-5 text-xs font-semibold text-foreground transition-colors hover:bg-accent focus-visible:border-[var(--hafta-950)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35 disabled:opacity-60"
            >
              Batal Ubah
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
