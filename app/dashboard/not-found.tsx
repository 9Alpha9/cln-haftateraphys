import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';

export default function DashboardNotFound() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center md:py-24">
      <p className="text-6xl font-bold tracking-tight text-muted-foreground/40 md:text-7xl">404</p>
      <h1 className="mt-4 text-xl font-bold tracking-tight text-foreground md:text-2xl">Halaman tidak ditemukan</h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        Halaman yang Anda cari di dalam panel tidak tersedia atau telah dipindahkan.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/">
          <Button variant="outline" size="lg" className="w-full sm:w-auto">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Kembali ke Beranda
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button size="lg" className="w-full sm:w-auto">
            <Home className="h-4 w-4" aria-hidden="true" />
            Ke Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
