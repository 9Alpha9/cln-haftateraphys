'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCcw, Home, ArrowLeft, ClipboardList } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-sm text-center">
          {/* Icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--hafta-ylw-50)]">
            <AlertTriangle className="h-8 w-8 text-[var(--hafta-ylw-200)]" />
          </div>

          {/* Title */}
          <h1 className="mt-6 text-xl font-bold text-[#111827]">Gagal Memuat Data</h1>

          {/* Description */}
          <p className="mt-2 text-[13px] text-[#6B7280] leading-relaxed">
            Terjadi kesalahan saat mengambil data dari server. Silakan coba muat ulang halaman.
          </p>

          {/* Error digest */}
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
              Muat Ulang
            </button>
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-5 text-[13px] font-medium text-[#6B7280] transition-all hover:bg-[#F7FAF8] hover:text-[#111827]"
            >
              <Home className="h-4 w-4" />
              Kembali ke Dashboard
            </Link>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-4 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--hafta-ylw-50)] text-[var(--hafta-ylw-200)]">
              <ClipboardList className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[12px] font-semibold text-[#111827]">Tips Mengatasi</p>
          <ul className="mt-1.5 space-y-1 text-[11px] text-[#6B7280]">
                <li>• Periksa koneksi internet Anda</li>
                <li>• Muat ulang halaman dengan menekan F5</li>
                <li>• Hubungi admin jika masalah berlanjut</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
