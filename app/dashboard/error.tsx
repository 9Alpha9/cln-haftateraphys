'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ErrorState } from '@/components/errors/error-state';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();

  useEffect(() => {
    console.error('[dashboard.error]', {
      digest: error.digest ?? null,
      name: error.name,
      message: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-8">
      <ErrorState
        compact
        code={500}
        digest={error.digest}
        pathname={pathname}
        onRetry={reset}
        homeHref="/dashboard"
        description="Data dashboard gagal dimuat. Sesi Anda tetap aman dan tidak ada data yang terhapus. Coba muat ulang; bila berulang, gunakan referensi insiden untuk melapor."
        primaryAction={{ href: '/dashboard', label: 'Kembali ke dashboard' }}
      />
    </div>
  );
}
