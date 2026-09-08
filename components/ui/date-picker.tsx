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

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const HOLIDAY_DOT_COLOR: Record<HolidayType, string> = {
  nasional: 'bg-red-500',
  agama: 'bg-purple-500',
  libur: 'bg-blue-500',
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
};

const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ value, onChange, disabled, required, placeholder = 'Pilih tanggal', id, name, className }, ref) => {
    const [open, setOpen] = React.useState(false);
    const selectedDate = parseDate(value);
    const [viewDate, setViewDate] = React.useState<Date>(selectedDate ?? new Date());

    const viewYear = viewDate.getFullYear();
    const viewMonth = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

    function selectDay(day: number) {
      const selected = new Date(viewYear, viewMonth, day);
      onChange?.(toDateString(selected));
      setOpen(false);
    }

    function prevMonth() {
      setViewDate(new Date(viewYear, viewMonth - 1, 1));
    }

    function nextMonth() {
      setViewDate(new Date(viewYear, viewMonth + 1, 1));
    }

    function goToToday() {
      const today = new Date();
      setViewDate(today);
      onChange?.(toDateString(today));
      setOpen(false);
    }

    return (
      <Popover open={open} onOpenChange={setOpen}>
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
                'flex h-10 w-full items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-left text-sm transition-colors outline-none cursor-pointer',
                'hover:border-accent focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent',
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
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={prevMonth}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2">
                <select
                  value={viewMonth}
                  onChange={(e) => setViewDate(new Date(viewYear, Number(e.target.value), 1))}
                  className="rounded-md border-0 bg-transparent text-sm font-semibold text-foreground outline-none cursor-pointer"
                >
                  {MONTH_NAMES.map((name, i) => (
                    <option key={i} value={i}>{name}</option>
                  ))}
                </select>
                <select
                  value={viewYear}
                  onChange={(e) => setViewDate(new Date(Number(e.target.value), viewMonth, 1))}
                  className="rounded-md border-0 bg-transparent text-sm font-semibold text-foreground outline-none cursor-pointer"
                >
                  {Array.from({ length: 21 }, (_, i) => viewYear - 10 + i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={nextMonth}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

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
                const holiday = getHoliday(viewMonth + 1, day);
                const dayOfWeek = new Date(viewYear, viewMonth, day).getDay();
                const isSunday = dayOfWeek === 0;

                return (
                  <div key={day} className="relative flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => selectDay(day)}
                      title={holiday ? `${holiday.name} (${HOLIDAY_LABEL[holiday.type]})` : undefined}
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-lg text-sm transition-colors',
                        'hover:bg-accent hover:text-accent-foreground',
                        isSelected && 'bg-accent text-accent-foreground font-bold',
                        !isSelected && isToday && 'font-bold text-[#e27409] border border-[#e27409] underline underline-offset-2 flex h-9 w-9 items-center justify-center rounded-lg text-sm transition-colors',
                        holiday && !isSelected && 'text-red-600 font-semibold',
                        !holiday && isSunday && !isSelected && 'text-red-500 font-semibold',
                      )}
                    >
                      {day}
                    </button>
                    {holiday && (
                      <span
                        className={cn('absolute bottom-0.5 h-1 w-1 rounded-full', HOLIDAY_DOT_COLOR[holiday.type])}
                        title={holiday.name}
                      />
                    )}
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
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Cuti Bersama
              </span>
            </div>

            {/* Footer */}
            <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
              <button
                type="button"
                onClick={goToToday}
                className="rounded-md px-2 py-1 text-xs font-medium text-[#e27409] hover:bg-accent hover:text-accent-foreground"
              >
                Hari Ini
              </button>
              {value && (
                <button
                  type="button"
                  onClick={() => { onChange?.(''); setOpen(false); }}
                  className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  Hapus
                </button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  },
);

DatePicker.displayName = 'DatePicker';

export { DatePicker };
