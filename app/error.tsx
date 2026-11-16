'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ErrorState } from '@/components/errors/error-state';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();

  useEffect(() => {
    // Log hanya digest/stack; jangan pernah menambahkan data pasien ke log.
    console.error('[app.error]', {
      digest: error.digest ?? null,
      name: error.name,
      message: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FCFCFB] px-4 py-10 sm:px-6">
      <ErrorState
        code={500}
        digest={error.digest}
        pathname={pathname}
        onRetry={reset}
        description="Halaman ini gagal dimuat karena kendala pada server. Data Anda tidak berubah. Gunakan referensi insiden di bawah saat melapor agar tim teknis dapat menelusuri penyebabnya."
      />
    </div>
  );
}
