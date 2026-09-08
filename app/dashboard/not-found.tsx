import Link from 'next/link';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-sm text-center">
          {/* Icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--hafta-ylw-50)]">
            <Search className="h-8 w-8 text-[var(--hafta-ylw-200)]" />
          </div>

          {/* 404 */}
          <p className="mt-6 text-6xl font-bold tracking-tight text-[#E5E7EB] md:text-7xl">404</p>

          {/* Title */}
          <h1 className="mt-4 text-xl font-bold tracking-tight text-[#111827] md:text-2xl">
            Halaman Tidak Ditemukan
          </h1>

          {/* Description */}
          <p className="mt-3 text-[13px] text-[#6B7280] leading-relaxed">
            Halaman yang Anda cari di dalam panel tidak tersedia atau telah dipindahkan.
          </p>

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-5 text-[13px] font-medium text-[#6B7280] transition-all hover:bg-[#F7FAF8] hover:text-[#111827]"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Beranda
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--hafta-ylw-200)] px-5 text-[13px] font-semibold text-[#111827] transition-all hover:bg-[var(--hafta-ylw-300)] shadow-sm active:scale-[0.98]"
            >
              <Home className="h-4 w-4" />
              Ke Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
