'use client';

import { useEffect, useState } from 'react';

function getGreeting(date: Date): string {
  const hour = date.getHours();
  if (hour < 11) return 'Selamat Pagi';
  if (hour < 15) return 'Selamat Siang';
  if (hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function LiveGreeting({
  name,
  initialNow,
}: {
  name: string;
  initialNow: string;
}) {
  const [now, setNow] = useState(() => new Date(initialNow));

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const timer = window.setInterval(tick, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <>
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">
        {formatDate(now)}
      </p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#181700] sm:text-3xl">
        {getGreeting(now)}, {name}
      </h1>
    </>
  );
}
