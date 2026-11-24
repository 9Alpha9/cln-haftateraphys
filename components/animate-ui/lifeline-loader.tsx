'use client';

import { motion } from 'motion/react';

// Jalur diberi margin 10 unit di kiri/kanan agar titik denyut (r=3.5) dan ujung
// garis tidak terpotong oleh mask (overflow-hidden) container.
const LIFELINE_PATH = 'M10 30 H50 l7 0 6 -16 8 32 8 -26 7 10 H190';
const CYCLE_SECONDS = 2.1;

/**
 * Animasi "lifeline" (garis EKG) yang dipakai sebagai indikator proses.
 *
 * Dibangun dengan `motion/react`, engine yang sama dengan komponen animate-ui
 * lain di repo ini, sehingga bisa dipakai berulang sebagai loader mandiri.
 * Garis menggambar ulang secara berulang, sementara titik denyut mengikuti
 * jalur SVG persis (lewat `animateMotion` dengan `path` yang sama) sehingga naik
 * turun mengikuti puncak gelombang, bukan berjalan lurus.
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
        <svg viewBox="0 0 200 56" fill="none" aria-hidden="true" className="h-14 w-full">
          {/* Jalur dasar samar agar garis terlihat utuh saat animasi berjalan */}
          <path
            d={LIFELINE_PATH}
            stroke="currentColor"
            strokeOpacity={0.12}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <motion.path
            d={LIFELINE_PATH}
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, pathOffset: 0, opacity: 0.9 }}
            animate={{ pathLength: [0, 1, 1], pathOffset: [0, 0, 1], opacity: [0.9, 1, 0.9] }}
            transition={{
              duration: CYCLE_SECONDS,
              times: [0, 0.55, 1],
              ease: 'easeInOut',
              repeat: Infinity,
            }}
          />
          {/* Titik denyut: mengikuti jalur yang sama, termasuk puncak gelombang.
              Berhenti di x=190 sehingga tidak menyentuh tepi mask. */}
          <circle r={3.5} fill="currentColor">
            <animateMotion
              dur={`${CYCLE_SECONDS}s`}
              repeatCount="indefinite"
              path={LIFELINE_PATH}
              keyPoints="0;1"
              keyTimes="0;1"
              calcMode="linear"
            />
            <animate
              attributeName="opacity"
              values="0;1;1;1;0"
              keyTimes="0;0.08;0.85;0.94;1"
              dur={`${CYCLE_SECONDS}s`}
              repeatCount="indefinite"
            />
          </circle>
        </svg>
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/70 to-transparent"
          initial={{ x: '-60%' }}
          animate={{ x: '160%' }}
          transition={{ duration: CYCLE_SECONDS, ease: 'linear', repeat: Infinity }}
        />
      </div>
      <p className="text-xs font-semibold text-stone-600">{label}</p>
    </div>
  );
}
