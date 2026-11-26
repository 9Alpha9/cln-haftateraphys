'use client';

import { SlidingNumber } from '@animate-ui/react/primitives/texts/sliding-number';

/**
 * Angka "sliding" (odometer) berbasis animate-ui `SlidingNumber`.
 *
 * Mulai dari 0 lalu bergulir ke nilai akhir. Animasi baru berjalan ketika
 * elemen benar-benar terlihat (`inView`) sehingga tidak bertabrakan dengan
 * fase skeleton halaman — skeleton tampil dulu, lalu angka bergulir saat
 * konten nyata sudah dirender. Menghormati `prefers-reduced-motion` secara
 * bawaan dari animate-ui.
 */
export function CountUp({
  value,
  decimals = 0,
  className,
}: {
  value: number;
  decimals?: number;
  className?: string;
}) {
  return (
    <SlidingNumber
      number={Number.isFinite(value) ? value : 0}
      fromNumber={0}
      decimalPlaces={decimals}
      inView
      inViewOnce
      inViewMargin="0px 0px -8% 0px"
      className={className}
      transition={{ stiffness: 70, damping: 20, mass: 1 }}
    />
  );
}
