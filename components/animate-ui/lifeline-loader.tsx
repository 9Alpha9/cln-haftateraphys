'use client';

import { useId } from 'react';
import { motion } from 'motion/react';

// Jalur diberi margin 10 unit di kiri/kanan agar titik denyut (r=3.5) dan ujung
// garis tidak terpotong oleh mask (overflow-hidden) container.
const LIFELINE_PATH = 'M10 30 H50 l7 0 6 -16 8 32 8 -26 7 10 H190';
const CYCLE_SECONDS = 2.1;
/**
 * Porsi siklus untuk menggambar garis. Sisa (1 - DRAW_FRACTION) dipakai untuk
 * sapuan keluar cepat, sehingga jejak detak berikutnya segera menyusul tanpa
 * jeda mati yang panjang. Titik denyut berhenti di titik yang sama sehingga
 * ujung garis dan titik selalu sinkron.
 */
const DRAW_FRACTION = 0.8;

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
  const idPrefix = useId().replace(/:/g, '');
  const gradientId = `lifeline-glow-${idPrefix}`;
  const maskId = `lifeline-glow-mask-${idPrefix}`;

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className ?? ''}`}
      role="status"
      aria-live="polite"
    >
      {/* Satu-satunya lapisan pemotong: container ini. Kilau diletakkan di dalam
          svg (bukan elemen absolut), jadi ikut terpotong oleh tepi yang sama. */}
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
              times: [0, DRAW_FRACTION, 1],
              ease: 'easeInOut',
              repeat: Infinity,
            }}
          />
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="white" stopOpacity={0} />
              <stop offset="50%" stopColor="white" stopOpacity={0.9} />
              <stop offset="100%" stopColor="white" stopOpacity={0} />
            </linearGradient>
            {/* Kilau hanya muncul di sepanjang jalur: jalur dipakai sebagai mask
                gradien, sehingga tidak ada persegi cahaya di luar garis EKG. */}
            <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={200} height={56}>
              <path
                d={LIFELINE_PATH}
                stroke="white"
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </mask>
          </defs>
          <g mask={`url(#${maskId})`}>
            <motion.rect
              x={-28}
              y={0}
              width={28}
              height={56}
              fill={`url(#${gradientId})`}
              initial={{ x: -28 }}
              animate={{ x: 200 }}
              transition={{ duration: CYCLE_SECONDS, ease: 'linear', repeat: Infinity }}
            />
          </g>
          {/* Titik denyut: mengikuti jalur yang sama, termasuk puncak gelombang.
              Berhenti di ujung jalur tepat saat garis selesai digambar
              (DRAW_FRACTION) agar ujung garis dan titik selalu sinkron, lalu
              memudar bersama sapuan keluar. */}
          <circle r={3.5} fill="currentColor">
            <animateMotion
              dur={`${CYCLE_SECONDS}s`}
              repeatCount="indefinite"
              path={LIFELINE_PATH}
              keyPoints="0;1;1"
              keyTimes={`0;${DRAW_FRACTION};1`}
              calcMode="linear"
            />
            <animate
              attributeName="opacity"
              values="0;1;1;0"
              keyTimes={`0;0.06;${DRAW_FRACTION};1`}
              dur={`${CYCLE_SECONDS}s`}
              repeatCount="indefinite"
            />
          </circle>
        </svg>
      </div>
      <p className="text-xs font-semibold text-stone-600">{label}</p>
    </div>
  );
}
