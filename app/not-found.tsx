import Link from 'next/link';
import { PublicHeader } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { Container } from '@/components/container';
import { Home, ArrowRight, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F7FAF8]">
      <PublicHeader />

      <main className="flex flex-1 items-center justify-center">
        <Container>
          <div className="flex flex-col items-center py-16 text-center md:py-24">
            {/* Icon */}
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--hafta-ylw-50)]">
              <Search className="h-10 w-10 text-[var(--hafta-ylw-200)]" />
            </div>

            {/* 404 */}
            <p className="mt-8 text-7xl font-bold tracking-tight text-[#111827] md:text-8xl">404</p>

            {/* Title */}
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#111827] md:text-3xl">
              Halaman Tidak Ditemukan
            </h1>

            {/* Description */}
            <p className="mt-3 max-w-md text-[15px] text-[#6B7280] leading-relaxed">
              Sepertinya halaman yang Anda cari tidak tersedia atau telah dipindahkan. Silakan kembali ke beranda atau
              hubungi kami.
            </p>

            {/* Actions */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--hafta-ylw-200)] px-6 text-[13px] font-semibold text-[#111827] transition-all hover:bg-[var(--hafta-ylw-300)] shadow-sm active:scale-[0.98]"
              >
                <Home className="h-4 w-4" />
                Kembali ke Beranda
              </Link>
              <Link
                href="https://wa.me/6281232932872"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-6 text-[13px] font-medium text-[#6B7280] transition-all hover:bg-[#F7FAF8] hover:text-[#111827]"
              >
                Hubungi Kami
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
