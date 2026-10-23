'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="id">
      <body className="min-h-screen bg-[#F7FAF8] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-sm text-center">
            {/* Icon */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FEF2F2]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8 text-[#dc2626]"
                aria-hidden="true"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>

            {/* Title */}
            <h1 className="mt-6 text-xl font-bold text-[#111827]">Terjadi Kesalahan</h1>

            {/* Description */}
            <p className="mt-2 text-[13px] text-[#6B7280] leading-relaxed">
              Sistem mengalami gangguan yang tidak terduga. Silakan coba kembali atau kembali ke beranda.
            </p>

            {/* Error digest (for debugging) */}
            {error.digest && (
              <div className="mt-4 rounded-lg bg-[#F7FAF8] p-3">
                <p className="text-[11px] font-mono text-[#9CA3AF]">Error ID: {error.digest}</p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={reset}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--hafta-ylw-100)] px-5 text-[13px] font-semibold text-[#181700] transition-all hover:bg-[var(--hafta-ylw-200)] shadow-sm active:scale-[0.98] cursor-pointer"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M8 16H3v5" />
                </svg>
                <span>Coba Lagi</span>
              </button>

              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-5 text-[13px] font-medium text-[#6B7280] transition-all hover:bg-[#F7FAF8] hover:text-[#111827]"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span>Kembali ke Beranda</span>
              </Link>
            </div>
          </div>

          {/* Footer note */}
          <p className="mt-4 text-center text-[11px] text-[#9CA3AF]">
            Jika masalah berlanjut, hubungi tim support Hafta Fisioterapi.
          </p>
        </div>
      </body>
    </html>
  );
}
