'use client';

import { motion } from 'motion/react';

/**
 * Animasi "lifeline" (garis EKG) yang dipakai sebagai indikator proses.
 *
 * Dibangun dengan `motion/react`, engine yang sama dengan komponen animate-ui
 * lain di repo ini, sehingga bisa dipakai berulang sebagai loader mandiri.
 * Garis luar menggambar ulang secara berulang dan sebuah sorotan bergerak dari
 * kiri ke kanan menyerupai denyut yang berjalan pada monitor.
 */
export function LifelineLoader({
  label = 'Menyiapkan dokumen PDF…',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className ?? ''}`}
      role="status"
      aria-live="polite"
    >
      <div className="relative w-44 overflow-hidden text-[var(--hafta-900)] sm:w-52">
        <svg
          viewBox="0 0 200 56"
          fill="none"
          aria-hidden="true"
          className="h-14 w-full"
        >
          {/* Jalur dasar samar agar garis terlihat utuh saat animasi berjalan */}
          <path
            d="M0 30 H44 l7 0 6 -16 8 32 8 -26 7 10 H200"
            stroke="currentColor"
            strokeOpacity={0.12}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <motion.path
            d="M0 30 H44 l7 0 6 -16 8 32 8 -26 7 10 H200"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, pathOffset: 0, opacity: 0.9 }}
            animate={{ pathLength: [0, 1, 1], pathOffset: [0, 0, 1], opacity: [0.9, 1, 0.9] }}
            transition={{ duration: 2.1, times: [0, 0.55, 1], ease: 'easeInOut', repeat: Infinity }}
          />
          <motion.circle
            r={3.5}
            fill="currentColor"
            initial={{ cx: 0, cy: 30, opacity: 0 }}
            animate={{ cx: [0, 200], cy: [30, 30], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 2.1, ease: 'linear', repeat: Infinity }}
          />
        </svg>
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/70 to-transparent"
          initial={{ x: '-60%' }}
          animate={{ x: '160%' }}
          transition={{ duration: 2.1, ease: 'linear', repeat: Infinity }}
        />
      </div>
      <p className="text-xs font-semibold text-stone-600">{label}</p>
    </div>
  );
}
