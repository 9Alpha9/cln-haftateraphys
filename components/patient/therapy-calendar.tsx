'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TherapyCalendarEntry = {
  id: string;
  recordedAt: Date;
  painScore: number | null;
  rangeOfMotionScore: number | null;
  status: 'FINALIZED' | 'DRAFT';
};

type Props = {
  entries: TherapyCalendarEntry[];
  /** Dipanggil saat tanggal bertanda terapi diketuk. */
  onSelectRecord: (recordId: string) => void;
};

const WEEKDAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

/** Kunci tanggal lokal stabil (hindari pergeseran timezone UTC). */
const dayKey = (value: Date) =>
  `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;

const monthLabel = (value: Date) =>
  value.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

/** Senin = indeks 0, Minggu = indeks 6. */
const mondayIndex = (value: Date) => (value.getDay() + 6) % 7;

export function TherapyCalendar({ entries, onSelectRecord }: Props) {
  const byDay = useMemo(() => {
    const map = new Map<string, TherapyCalendarEntry[]>();
    for (const entry of entries) {
      const key = dayKey(entry.recordedAt);
      const list = map.get(key);
      if (list) list.push(entry);
      else map.set(key, [entry]);
    }
    return map;
  }, [entries]);

  const latestDate = useMemo(() => {
    if (entries.length === 0) return new Date();
    return entries.reduce(
      (newest, entry) => (entry.recordedAt.getTime() > newest.getTime() ? entry.recordedAt : newest),
      entries[0].recordedAt,
    );
  }, [entries]);

  const [monthCursor, setMonthCursor] = useState(
    () => new Date(latestDate.getFullYear(), latestDate.getMonth(), 1),
  );
  const [selectedDay, setSelectedDay] = useState<string | null>(() => dayKey(latestDate));

  const days = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leading = mondayIndex(first);
    const cells: { key: string; date: Date; inMonth: boolean }[] = [];

    for (let i = leading; i > 0; i -= 1) {
      const date = new Date(year, month, 1 - i);
      cells.push({ key: dayKey(date), date, inMonth: false });
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      cells.push({ key: dayKey(date), date, inMonth: true });
    }
    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1]!.date;
      const date = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
      cells.push({ key: dayKey(date), date, inMonth: false });
    }
    return cells;
  }, [monthCursor]);

  const selectedEntries = selectedDay ? byDay.get(selectedDay) ?? [] : [];
  const selectedDate = selectedDay ? new Date(`${selectedDay}T00:00:00`) : null;
  const sessionCountInMonth = days.reduce(
    (total, cell) => (cell.inMonth ? total + (byDay.get(cell.key)?.length ?? 0) : total),
    0,
  );

  const todayKey = dayKey(new Date());

  const shiftMonth = (delta: number) => {
    setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
    setSelectedDay(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Kalender Terapi
          </p>
          <p className="mt-0.5 text-[12.5px] font-semibold capitalize text-foreground">
            {monthLabel(monthCursor)}
            <span className="ml-1.5 font-normal text-muted-foreground">
              · {sessionCountInMonth} sesi
            </span>
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="Bulan sebelumnya"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label="Bulan berikutnya"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1 text-center">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((cell) => {
          const dayEntries = byDay.get(cell.key) ?? [];
          const hasTherapy = dayEntries.length > 0;
          const isSelected = selectedDay === cell.key;
          const isToday = todayKey === cell.key;

          return (
            <button
              key={cell.key}
              type="button"
              disabled={!hasTherapy}
              onClick={() => setSelectedDay(cell.key)}
              aria-label={
                hasTherapy
                  ? `${cell.date.getDate()} — ${dayEntries.length} sesi terapi`
                  : `${cell.date.getDate()} — tidak ada terapi`
              }
              aria-pressed={isSelected}
              className={cn(
                'relative flex h-9 cursor-pointer flex-col items-center justify-center rounded-lg text-[12px] tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35 sm:h-10',
                !cell.inMonth && 'opacity-40',
                hasTherapy
                  ? 'font-semibold text-foreground hover:bg-[var(--hafta-100)]'
                  : 'text-muted-foreground/55 cursor-default',
                isSelected && hasTherapy && 'bg-[var(--hafta-900)] text-white hover:bg-[var(--hafta-800)]',
                isToday && !isSelected && 'ring-1 ring-inset ring-[var(--hafta-300)]',
              )}
            >
              {cell.date.getDate()}
              {hasTherapy ? (
                <span
                  className={cn(
                    'absolute bottom-1 h-1 w-1 rounded-full',
                    isSelected ? 'bg-white' : 'bg-[var(--hafta-500)]',
                  )}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-3 border-t border-border/70 pt-3">
        {selectedDate ? (
          selectedEntries.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-muted-foreground">
                {selectedDate.toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              {selectedEntries.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => onSelectRecord(entry.id)}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl hafta-tint px-3 py-2 text-left transition-colors hover:bg-[var(--hafta-100)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
                >
                  <span className="min-w-0 flex-1 text-[12px] leading-relaxed text-foreground">
                    Nyeri{' '}
                    <span className="font-semibold tabular-nums">{entry.painScore ?? '-'}/10</span>
                    <span className="mx-1.5 text-muted-foreground">·</span>
                    ROM{' '}
                    <span className="font-semibold tabular-nums">
                      {entry.rangeOfMotionScore != null ? `${entry.rangeOfMotionScore * 10}%` : '-'}
                    </span>
                  </span>
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[var(--hafta-700)]">
                    Lihat
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-muted-foreground">
              Tidak ada terapi pada tanggal ini.
            </p>
          )
        ) : (
          <p className="text-[12px] text-muted-foreground">
            Ketuk tanggal bertanda untuk melihat progres hari itu.
          </p>
        )}
      </div>
    </div>
  );
}
