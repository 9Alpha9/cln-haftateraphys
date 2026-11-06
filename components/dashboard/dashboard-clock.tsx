'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const TIME_ZONE = 'Asia/Jakarta';

export function DashboardClock({ className }: { className?: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const initial = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, []);

  if (!now) {
    return <span className={cn('block h-4 w-24 animate-pulse rounded bg-stone-100', className)} />;
  }

  const date = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TIME_ZONE,
  });
  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: TIME_ZONE,
  });
  const timeParts = timeFormatter.formatToParts(now);
  const time = ['hour', 'minute', 'second']
    .map((part) => timeParts.find((item) => item.type === part)?.value ?? '00')
    .join(':');

  return (
    <div className={cn('flex flex-col items-start justify-center text-left leading-tight', className)}>
      <span className="hidden text-[10px] font-semibold uppercase tracking-[0.08em] text-stone-500 sm:block">
        {date}
      </span>
      <span className="flex items-baseline gap-1 font-mono text-[11px] font-bold tabular-nums text-[#181700] sm:text-xs">
        {time}
        <span className="font-sans text-[9px] font-semibold tracking-wide text-stone-400">WIB</span>
      </span>
    </div>
  );
}
