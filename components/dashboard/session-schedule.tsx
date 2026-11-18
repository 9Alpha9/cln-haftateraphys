'use client';

import { useSyncExternalStore } from 'react';

/**
 * Label zona waktu Indonesia yang mengikuti zona perangkat pengguna.
 * `id-ID` mengembalikan singkatan resmi (WIB/WITA/WIT) untuk zona Indonesia,
 * dan singkatan generik (mis. GMT+8) untuk zona lain.
 */
function detectTimeZoneLabel(): string {
  try {
    const parts = new Intl.DateTimeFormat('id-ID', { timeZoneName: 'short' }).formatToParts(new Date());
    const label = parts.find((part) => part.type === 'timeZoneName')?.value?.trim();
    if (label) return label;
  } catch {
    // Intl tidak tersedia: pakai fallback di bawah.
  }
  const offsetHours = -new Date().getTimezoneOffset() / 60;
  if (offsetHours === 7) return 'WIB';
  if (offsetHours === 8) return 'WITA';
  if (offsetHours === 9) return 'WIT';
  return `UTC${offsetHours >= 0 ? '+' : ''}${offsetHours}`;
}

function addMinutes(time: string, minutes: number): string {
  const [hour, minute] = time.split(':').map((value) => Number(value));
  if (Number.isNaN(hour) || Number.isNaN(minute)) return '';
  const total = (hour * 60 + minute + minutes) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function formatDateLabel(value: string): string {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Tanggal sesi (besar) dan rentang jam lengkap dengan zona waktu di baris
 * terpisah, agar mudah dibaca pada kartu ringkasan dashboard.
 */
export function SessionSchedule({
  scheduledDate,
  startTime,
  durationMinutes,
}: {
  scheduledDate: string;
  startTime: string;
  durationMinutes: number;
}) {
  // Zona waktu hanya diketahui di perangkat pengguna. `useSyncExternalStore`
  // memberi nilai berbeda untuk server (kosong) dan klien tanpa memicu
  // setState di dalam effect, sehingga hidrasi tetap aman.
  const zone = useSyncExternalStore(
    () => () => {},
    () => detectTimeZoneLabel(),
    () => '',
  );

  const start = startTime.slice(0, 5);
  const end = durationMinutes > 0 ? addMinutes(start, durationMinutes) : '';

  return (
    <>
      <h3 className="mt-2 text-xl font-extrabold leading-tight sm:text-2xl">
        {formatDateLabel(scheduledDate)}
      </h3>
      <p className="mt-1 text-sm font-semibold text-foreground/80" suppressHydrationWarning>
        {end ? `${start}–${end}` : start}
        {zone ? ` ${zone}` : ''}
      </p>
    </>
  );
}
