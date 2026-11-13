import Link from 'next/link';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-stone-200/70 bg-white p-8  text-center">
          {/* Icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--hafta-org-50)]">
            <Search className="h-8 w-8 text-[var(--hafta-org-200)]" />
          </div>

          {/* 404 */}
          <p className="mt-6 text-6xl font-bold tracking-tight text-stone-200 md:text-7xl">404</p>

          {/* Title */}
          <h1 className="mt-4 text-xl font-bold tracking-tight text-[#181700] md:text-2xl">
            Halaman Tidak Ditemukan
          </h1>

          {/* Description */}
          <p className="mt-3 text-[13px] text-stone-500 leading-relaxed">
            Halaman yang Anda cari di dalam panel tidak tersedia atau telah dipindahkan.
          </p>

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-stone-200/90 bg-white px-4 text-[13px] font-semibold text-[#181700] transition-colors hover:bg-stone-100 sm:px-5"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Beranda
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--hafta-org-100)] px-4 text-[13px] font-bold text-[#181700]  transition-colors hover:bg-[var(--hafta-org-200)] active:scale-[0.98] sm:px-5"
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
