'use client';

import { useEffect, useRef } from 'react';

/**
 * Angka yang "berhitung naik" dari 0 ke nilai akhir saat pertama dimuat /
 * saat nilainya berubah — memberi kesan data sedang dihitung setelah loading.
 *
 * Ditulis dengan requestAnimationFrame langsung pada `textContent` (bukan
 * setState per frame) agar tidak memicu re-render React 60x/detik. Nilai SSR
 * tetap nilai akhir sehingga tidak ada layout shift atau hydration mismatch,
 * lalu animasi dimulai dari 0 di client.
 */
export function CountUp({
  value,
  decimals = 0,
  duration = 900,
  className,
}: {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const target = Number.isFinite(value) ? value : 0;
    const format = (next: number) => next.toFixed(decimals);

    const prefersReducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || duration <= 0) {
      element.textContent = format(target);
      return;
    }

    let frame = 0;
    const startedAt = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      // easeOutCubic: cepat di awal, melambat menjelang nilai akhir.
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = format(target * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        element.textContent = format(target);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, decimals, duration]);

  return (
    <span ref={ref} className={className}>
      {value.toFixed(decimals)}
    </span>
  );
}
