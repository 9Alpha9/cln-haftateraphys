'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { getHoliday, type HolidayType } from '@/lib/holidays-indonesia';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const HOLIDAY_DOT_COLOR: Record<HolidayType, string> = {
  nasional: 'bg-red-500',
  agama: 'bg-purple-500',
  libur: 'bg-hafta-ble-500',
};

const HOLIDAY_LABEL: Record<HolidayType, string> = {
  nasional: 'Hari Libur Nasional',
  agama: 'Hari Raya / Hari Besar Agama',
  libur: 'Hari Libur / Cuti Bersama',
};

function toDateString(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function parseDate(value: string | undefined | null): Date | null {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return isNaN(d.getTime()) ? null : d;
}

function formatDisplay(date: Date | null): string {
  if (!date) return '';
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

type DatePickerProps = {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  id?: string;
  name?: string;
  className?: string;
  /** Earliest selectable date in YYYY-MM-DD format. */
  minDate?: string;
  /** Prevent selecting dates before today. */
  disablePast?: boolean;
  /** Batas atas opsional (YYYY-MM-DD). */
  maxDate?: string;
};

/** Jarak aman dari tepi bawah viewport agar tidak menutupi bottom navigation mobile. */
const BOTTOM_SAFE_GAP = 96;

const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  (
    { value, onChange, disabled, required, placeholder = 'Pilih tanggal', id, name, className, minDate, disablePast, maxDate },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false);
    const [view, setView] = React.useState<'days' | 'months' | 'years'>('days');
    const selectedDate = parseDate(value);
    const [viewDate, setViewDate] = React.useState<Date>(selectedDate ?? new Date());
    const [yearPageStart, setYearPageStart] = React.useState(
      () => (selectedDate ?? new Date()).getFullYear() - 5,
    );
    const effectiveMinDate = minDate ?? (disablePast ? toDateString(new Date()) : undefined);
    const minDateValue = effectiveMinDate ? new Date(`${effectiveMinDate}T00:00:00`) : null;
    const maxDateValue = maxDate ? new Date(`${maxDate}T00:00:00`) : null;
    const viewYear = viewDate.getFullYear();
    const viewMonth = viewDate.getMonth();
    const canGoPrev =
      !minDateValue ||
      new Date(viewYear, viewMonth, 1).getTime() >
        new Date(minDateValue.getFullYear(), minDateValue.getMonth(), 1).getTime();
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

    function selectDay(day: number) {
      const selected = new Date(viewYear, viewMonth, day);
      const selectedKey = toDateString(selected);
      if (effectiveMinDate && selectedKey < effectiveMinDate) return;
      if (maxDate && selectedKey > maxDate) return;
      onChange?.(selectedKey);
      setOpen(false);
      setView('days');
    }

    function shiftMonth(delta: number) {
      setViewDate(new Date(viewYear, viewMonth + delta, 1));
    }

    function goToToday() {
      const today = new Date();
      setViewDate(today);
      onChange?.(toDateString(today));
      setOpen(false);
      setView('days');
    }

    function pickMonth(month: number) {
      setViewDate(new Date(viewYear, month, 1));
      setView('days');
    }

    function pickYear(year: number) {
      setYearPageStart(year - 5);
      setViewDate(new Date(year, viewMonth, 1));
      setView('months');
    }

    const years = React.useMemo(
      () => Array.from({ length: 12 }, (_, i) => yearPageStart + i),
      [yearPageStart],
    );

    return (
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) {
            const nextView = selectedDate ?? new Date();
            setViewDate(nextView);
            setYearPageStart(nextView.getFullYear() - 5);
            setView('days');
          }
        }}
      >
        <PopoverTrigger asChild>
          <div className="relative">
            <input
              ref={ref}
              type="hidden"
              id={id}
              name={name}
              value={value ?? ''}
              required={required}
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() => !disabled && setOpen(true)}
              className={cn(
                'flex h-11 w-full items-center gap-2 rounded-xl border border-stone-200/90 bg-background px-3 py-2 text-left text-sm transition-colors outline-none cursor-pointer',
                'hover:border-stone-300 focus:border-[#181700] focus:outline-none focus:ring-4 focus:ring-[var(--hafta-org-200)]/35',
                'disabled:cursor-not-allowed disabled:opacity-50',
                !value && 'text-muted-foreground',
                className,
              )}
            >
              <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate">{value ? formatDisplay(selectedDate) : placeholder}</span>
            </button>
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-[17.5rem] max-w-[calc(100vw-1.5rem)] p-0"
          align="start"
          sideOffset={8}
          collisionPadding={{ top: 12, right: 12, bottom: BOTTOM_SAFE_GAP, left: 12 }}
          sticky="always"
        >
          <div className="p-3">
            {/* Header — navigasi bulan/tahun memakai kontrol internal, bukan select bawaan sistem */}
            <div className="flex items-center justify-between gap-1">
              <button
                type="button"
                onClick={() => {
                  if (view === 'years') setYearPageStart((current) => current - 12);
                  else shiftMonth(-1);
                }}
                disabled={view === 'days' && !canGoPrev}
                aria-label={view === 'years' ? '12 tahun sebelumnya' : 'Bulan sebelumnya'}
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex min-w-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => setView((current) => (current === 'months' ? 'days' : 'months'))}
                  aria-label="Pilih bulan"
                  aria-expanded={view === 'months'}
                  className={cn(
                    'cursor-pointer rounded-lg px-2 py-1 text-sm font-semibold transition-colors hover:bg-accent',
                    view === 'months' ? 'bg-accent text-accent-foreground' : 'text-foreground',
                  )}
                >
                  {MONTH_NAMES[viewMonth]}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setYearPageStart(viewYear - 5);
                    setView((current) => (current === 'years' ? 'days' : 'years'));
                  }}
                  aria-label="Pilih tahun"
                  aria-expanded={view === 'years'}
                  className={cn(
                    'cursor-pointer rounded-lg px-2 py-1 text-sm font-semibold tabular-nums transition-colors hover:bg-accent',
                    view === 'years' ? 'bg-accent text-accent-foreground' : 'text-foreground',
                  )}
                >
                  {viewYear}
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (view === 'years') setYearPageStart((current) => current + 12);
                  else shiftMonth(1);
                }}
                aria-label={view === 'years' ? '12 tahun berikutnya' : 'Bulan berikutnya'}
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {view === 'days' ? (
              <>
                {/* Day labels */}
                <div className="mt-2 grid grid-cols-7 gap-1">
                  {DAY_LABELS.map((d) => (
                    <div key={d} className="py-1 text-center text-[11px] font-medium text-muted-foreground">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = toDateString(new Date(viewYear, viewMonth, day));
                    const isSelected = value === dateStr;
                    const isToday = toDateString(new Date()) === dateStr;
                    const holiday = getHoliday(viewYear, viewMonth + 1, day);
                    const dayOfWeek = new Date(viewYear, viewMonth, day).getDay();
                    const isSunday = dayOfWeek === 0;
                    const isDisabled =
                      Boolean(effectiveMinDate && dateStr < effectiveMinDate) ||
                      Boolean(maxDate && dateStr > maxDate);

                    return (
                      <div key={day} className="relative flex flex-col items-center">
                        <button
                          type="button"
                          onClick={() => selectDay(day)}
                          disabled={isDisabled}
                          aria-disabled={isDisabled}
                          aria-label={`${day} ${MONTH_NAMES[viewMonth]} ${viewYear}`}
                          aria-current={isSelected ? 'date' : undefined}
                          title={holiday ? `${holiday.name} (${HOLIDAY_LABEL[holiday.type]})` : undefined}
                          className={cn(
                            'flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-sm transition-colors',
                            'hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35',
                            isDisabled && 'cursor-not-allowed opacity-30 hover:bg-transparent',
                            isSelected && 'bg-accent font-bold text-accent-foreground',
                            !isSelected && isToday && 'border border-[#e27409] font-bold text-[#e27409]',
                            holiday && !isSelected && 'font-semibold text-red-600',
                            !holiday && isSunday && !isSelected && 'font-semibold text-red-500',
                          )}
                        >
                          {day}
                        </button>
                        {holiday ? (
                          <span
                            className={cn('absolute bottom-0.5 h-1 w-1 rounded-full', HOLIDAY_DOT_COLOR[holiday.type])}
                            title={holiday.name}
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-2">
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Nasional
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-500" /> Agama
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-hafta-ble-500" /> Cuti Bersama
                  </span>
                </div>
              </>
            ) : null}

            {view === 'months' ? (
              <div className="mt-3 grid grid-cols-3 gap-1.5">
                {MONTH_SHORT.map((label, index) => {
                  const isActive = index === viewMonth;
                  const isBeforeMin =
                    minDateValue !== null &&
                    new Date(viewYear, index + 1, 0).getTime() <
                      new Date(minDateValue.getFullYear(), minDateValue.getMonth(), minDateValue.getDate()).getTime();
                  const isAfterMax =
                    maxDateValue !== null &&
                    new Date(viewYear, index, 1).getTime() > maxDateValue.getTime();
                  const isDisabled = isBeforeMin || isAfterMax;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => pickMonth(index)}
                      disabled={isDisabled}
                      aria-pressed={isActive}
                      className={cn(
                        'flex h-10 cursor-pointer items-center justify-center rounded-lg text-xs font-semibold transition-colors',
                        isDisabled && 'cursor-not-allowed opacity-30',
                        isActive
                          ? 'bg-accent text-accent-foreground'
                          : 'text-foreground hover:bg-accent hover:text-accent-foreground',
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {view === 'years' ? (
              <div className="mt-3 grid grid-cols-4 gap-1.5">
                {years.map((year) => {
                  const isActive = year === viewYear;
                  const isDisabled =
                    (minDateValue !== null && year < minDateValue.getFullYear()) ||
                    (maxDateValue !== null && year > maxDateValue.getFullYear());
                  return (
                    <button
                      key={year}
                      type="button"
                      onClick={() => pickYear(year)}
                      disabled={isDisabled}
                      aria-pressed={isActive}
                      className={cn(
                        'flex h-10 cursor-pointer items-center justify-center rounded-lg text-xs font-semibold tabular-nums transition-colors',
                        isDisabled && 'cursor-not-allowed opacity-30',
                        isActive
                          ? 'bg-accent text-accent-foreground'
                          : 'text-foreground hover:bg-accent hover:text-accent-foreground',
                      )}
                    >
                      {year}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {/* Footer */}
            <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
              <button
                type="button"
                onClick={goToToday}
                className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-[#e27409] hover:bg-accent hover:text-accent-foreground"
              >
                Hari Ini
              </button>
              {value ? (
                <button
                  type="button"
                  onClick={() => {
                    onChange?.('');
                    setOpen(false);
                    setView('days');
                  }}
                  className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  Hapus
                </button>
              ) : null}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  },
);

DatePicker.displayName = 'DatePicker';

export { DatePicker };
