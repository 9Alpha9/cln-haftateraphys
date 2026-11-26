'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
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
  /** Dipanggil saat TANGGAL bertanda terapi diketuk — memilih sesi tsb. */
  onSelectDay?: (entry: TherapyCalendarEntry) => void;
  /** Dipanggil saat tombol "Lihat" pada detail hari diketuk. */
  onSelectRecord: (recordId: string) => void;
};

const WEEKDAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

/** Kunci tanggal lokal stabil (hindari pergeseran timezone UTC). */
const dayKey = (value: Date) =>
  `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;

const monthLabel = (value: Date) => value.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

/** Senin = indeks 0, Minggu = indeks 6. */
const mondayIndex = (value: Date) => (value.getDay() + 6) % 7;

export function TherapyCalendar({ entries, onSelectDay, onSelectRecord }: Props) {
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

  const [monthCursor, setMonthCursor] = useState(() => new Date(latestDate.getFullYear(), latestDate.getMonth(), 1));
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

  const selectedEntries = selectedDay ? (byDay.get(selectedDay) ?? []) : [];
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
          <h2 className="inline-flex items-center gap-1.5 text-base font-semibold tracking-tight text-foreground">
            <CalendarDays className="h-3.5 w-3.5 text-[var(--hafta-300)]" />
            Kalender Terapi
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {monthLabel(monthCursor)}
            <span className="ml-1.5">· {sessionCountInMonth} sesi</span>
          </p>
        </div>
        <div className="flex items-center gap-1" role="group" aria-label="Navigasi bulan">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="Bulan sebelumnya"
            className="tap-target flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label="Bulan berikutnya"
            className="tap-target flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/80">
            {label}
          </span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-x-1 gap-y-0.5">
        {days.map((cell) => {
          const dayEntries = byDay.get(cell.key) ?? [];
          const hasTherapy = dayEntries.length > 0;
          const isSelected = selectedDay === cell.key;
          const isToday = todayKey === cell.key;

          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => {
                if (!cell.inMonth) {
                  setMonthCursor(new Date(cell.date.getFullYear(), cell.date.getMonth(), 1));
                }
                setSelectedDay(cell.key);
                // Tanggal terapi dipilih = sesi terkait ikut terpilih.
                if (cell.inMonth && dayEntries[0]) onSelectDay?.(dayEntries[0]);
              }}
              aria-label={
                hasTherapy
                  ? `${cell.date.getDate()} — ${dayEntries.length} sesi terapi`
                  : `${cell.date.getDate()} — tidak ada terapi`
              }
              aria-pressed={isSelected}
              className={cn(
                'tap-target relative flex h-10 cursor-pointer flex-col items-center justify-center rounded-lg text-xs tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35 sm:h-9',
                // Tanggal di luar bulan: teks redup saja — latar abu-abu membuat kalender berisik.
                !cell.inMonth && 'text-stone-400',
                hasTherapy
                  ? 'font-semibold text-foreground hover:bg-[var(--hafta-100)]'
                  : 'text-stone-600 hover:bg-accent hover:text-foreground',
                isSelected && hasTherapy && 'bg-[var(--hafta-900)] text-white hover:bg-[var(--hafta-800)]',
                isSelected && !hasTherapy && 'bg-[var(--hafta-100)] text-foreground',
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

      <div className="mt-3 space-y-1.5 border-t border-border/70 pt-2.5">
        {selectedDate ? (
          selectedEntries.length > 0 ? (
            selectedEntries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => onSelectRecord(entry.id)}
                className="tap-target flex w-full cursor-pointer items-center gap-3 rounded-xl hafta-tint px-3 py-2 text-left transition-colors hover:bg-[var(--hafta-100)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
              >
                <span className="min-w-0 flex-1 text-xs leading-relaxed text-foreground">
                  Nyeri <span className="font-semibold tabular-nums">{entry.painScore ?? '-'}/10</span>
                  <span className="mx-1.5 text-muted-foreground">·</span>
                  ROM{' '}
                  <span className="font-semibold tabular-nums">
                    {entry.rangeOfMotionScore != null ? `${entry.rangeOfMotionScore * 10}%` : '-'}
                  </span>
                </span>
                <span className="shrink-0 text-xs font-semibold text-[var(--hafta-700)]">Lihat</span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </button>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">Tidak ada terapi pada tanggal ini.</p>
          )
        ) : (
          <p className="text-xs text-muted-foreground">Ketuk tanggal untuk melihat progres hari itu.</p>
        )}
      </div>
    </div>
  );
}
