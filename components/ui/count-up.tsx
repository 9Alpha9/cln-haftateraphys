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
  duration = 1600,
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

    // Tampilkan 0 lebih dulu supaya animasi selalu terlihat sejak frame pertama,
    // walaupun hidrasi terjadi sangat cepat.
    element.textContent = format(0);

    let frame = 0;
    let startedAt: number | null = null;

    const tick = (now: number) => {
      if (startedAt === null) startedAt = now;
      const progress = Math.min(1, (now - startedAt) / duration);
      // easeOutQuad: tetap terlihat "berjalan" sampai akhir, tidak melompat
      // langsung ke nilai akhir seperti easeOutCubic.
      const eased = 1 - Math.pow(1 - progress, 2);
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
