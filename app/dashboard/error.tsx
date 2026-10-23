'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log teknis disimpan di console internal
    console.error('[Dashboard Error Boundary]:', error);
  }, [error]);

  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center p-6 text-center">
      {/* Icon Alert Circle inline SVG — aman dari kegagalan chunk lucide-react */}
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--hafta-red-50)] text-[var(--hafta-red-600)] shadow-2xs">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-7 w-7"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <h2 className="mt-4 text-lg font-bold text-[#181700] sm:text-xl">
        Terjadi Kendala Memuat Data
      </h2>
      <p className="mt-1.5 max-w-md text-xs sm:text-sm text-stone-600 leading-relaxed">
        Gagal memuat informasi dashboard saat ini. Silakan periksa koneksi internet Anda atau coba muat ulang halaman.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {/* Tombol Coba Lagi dengan inline Refresh icon */}
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--hafta-ylw-100)] px-4 py-2.5 text-xs font-bold text-[#181700] shadow-2xs hover:bg-[var(--hafta-ylw-200)] transition-all cursor-pointer"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
            aria-hidden="true"
          >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M8 16H3v5" />
          </svg>
          <span>Coba Lagi</span>
        </button>

        {/* Link Kembali ke Dashboard dengan inline Home icon */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors shadow-2xs"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
            aria-hidden="true"
          >
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>Kembali ke Beranda Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
