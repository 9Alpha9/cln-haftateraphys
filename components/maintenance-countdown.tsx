'use client';

import { useEffect, useState } from 'react';
import { Clock3 } from 'lucide-react';

type Remaining = { days: number; hours: number; minutes: number; seconds: number };

function calculateRemaining(target: string): Remaining | null {
  const targetTime = new Date(target).getTime();
  if (Number.isNaN(targetTime)) return null;
  const diff = targetTime - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1_000) % 60),
  };
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex min-w-[58px] flex-col items-center rounded-xl border border-stone-200 bg-white px-3 py-2">
      <span className="font-mono text-xl font-bold tabular-nums text-[#181700]">
        {String(value).padStart(2, '0')}
      </span>
      <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-stone-500">{label}</span>
    </div>
  );
}

export function MaintenanceCountdown({ until }: { until: string }) {
  const [remaining, setRemaining] = useState<Remaining | null>(null);

  useEffect(() => {
    const update = () => setRemaining(calculateRemaining(until));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [until]);

  if (!until) return null;

  const finished = remaining && remaining.days + remaining.hours + remaining.minutes + remaining.seconds === 0;

  return (
    <div className="mt-7 w-full max-w-lg rounded-2xl border border-stone-200/80 bg-white/70 p-4 backdrop-blur">
      <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-stone-500">
        <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
        {finished ? 'Pemeliharaan segera berakhir' : 'Perkiraan kembali normal'}
      </p>
      {finished ? (
        <p className="mt-2 text-sm text-stone-600">Silakan muat ulang halaman beberapa saat lagi.</p>
      ) : (
        <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start" aria-live="polite">
          <Unit value={remaining?.days ?? 0} label="Hari" />
          <Unit value={remaining?.hours ?? 0} label="Jam" />
          <Unit value={remaining?.minutes ?? 0} label="Menit" />
          <Unit value={remaining?.seconds ?? 0} label="Detik" />
        </div>
      )}
      <p className="mt-2 text-[10px] text-stone-400">
        Waktu selesai:{' '}
        {new Date(until).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })} WIB
      </p>
    </div>
  );
}
