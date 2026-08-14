import Link from 'next/link';
import { PublicHeader } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { Container } from '@/components/container';
import { ArrowRight, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PublicHeader />

      <main className="flex flex-1 items-center justify-center bg-gradient-to-b from-emerald-900 to-emerald-800 text-white">
        <Container>
          <div className="flex flex-col items-center py-16 text-center md:py-24">
            <p className="text-7xl font-bold tracking-tight md:text-8xl">404</p>
            <h1 className="mt-4 text-2xl font-bold tracking-tight md:text-3xl">Halaman tidak ditemukan</h1>
            <p className="mt-3 max-w-md text-emerald-100/80 leading-relaxed">
              Sepertinya halaman yang Anda cari tidak tersedia atau telah dipindahkan. Silakan kembali ke beranda atau
              hubungi kami.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-6 text-sm font-medium text-emerald-900 transition-colors hover:bg-white/90"
              >
                <Home className="h-4 w-4" />
                Kembali ke Beranda
              </Link>
              <Link
                href="https://wa.me/6281232932872"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/30 px-6 text-sm font-medium text-white transition-colors hover:bg-white/10"
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
