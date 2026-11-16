import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { ErrorState } from '@/components/errors/error-state';
import { isSafePath } from '@/lib/error-catalog';

export const metadata: Metadata = {
  title: 'Akses Ditolak',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ForbiddenPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const params = await searchParams;
  const headerPath = (await headers()).get('x-pathname');
  const from = isSafePath(params.from) ? params.from : headerPath;

  return (
    <div className="min-h-screen bg-[#FCFCFB] px-4 py-10 sm:px-6">
      <ErrorState
        code={403}
        pathname={from}
        description="Akun Anda tidak memiliki izin untuk membuka halaman atau data ini. Jika Anda pasien, pastikan halaman yang dibuka adalah milik akun Anda sendiri."
        primaryAction={{ href: '/dashboard', label: 'Kembali ke dashboard' }}
        homeHref="/"
      />
    </div>
  );
}
