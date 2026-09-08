'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

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
              <AlertTriangle className="h-8 w-8 text-[#dc2626]" />
            </div>

            {/* Title */}
            <h1 className="mt-6 text-xl font-bold text-[#111827]">Terjadi Kesalahan</h1>

            {/* Description */}
            <p className="mt-2 text-[13px] text-[#6B7280] leading-relaxed">
              Sistem mengalami gangguan yang tidak terduga. Tim teknis telah diberitahu secara otomatis.
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
                onClick={reset}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--hafta-ylw-200)] px-5 text-[13px] font-semibold text-[#111827] transition-all hover:bg-[var(--hafta-ylw-300)] shadow-sm active:scale-[0.98]"
              >
                <RefreshCcw className="h-4 w-4" />
                Coba Lagi
              </button>
              <a
                href="/"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-5 text-[13px] font-medium text-[#6B7280] transition-all hover:bg-[#F7FAF8] hover:text-[#111827]"
              >
                <Home className="h-4 w-4" />
                Kembali ke Beranda
              </a>
            </div>
          </div>

          {/* Footer note */}
          <p className="mt-4 text-center text-[11px] text-[#9CA3AF]">
            Jika masalah berlanjut, hubungi tim support kami.
          </p>
        </div>
      </body>
    </html>
  );
}
