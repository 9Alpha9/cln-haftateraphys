'use client';

import { cn } from '@/lib/utils';

/**
 * Indikator loading "line heartbeat" global — garis ECG berjalan.
 * Dipakai sebagai loading utama pada viewer/kartu yang menunggu aset/data.
 * Animasi didefinisikan di `app/globals.css` (`animate-line-heartbeat`).
 */
export function LineHeartbeat({ className, label = 'Memuat…' }: { className?: string; label?: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn('inline-flex items-center gap-2 text-[var(--hafta-700)]', className)}
    >
      <svg aria-hidden="true" viewBox="0 0 120 24" className="h-6 w-28 shrink-0" fill="none">
        <polyline
          points="0,12 18,12 24,4 30,20 38,12 58,12 64,6 70,18 78,12 98,12 104,4 110,20 120,12"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="60 200"
          className="animate-line-heartbeat"
        />
      </svg>
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}
