'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ErrorState } from '@/components/errors/error-state';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();

  useEffect(() => {
    console.error('[auth.error]', {
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
        homeHref="/login"
        description="Form autentikasi gagal dimuat. Kata sandi dan data akun Anda tidak terkirim. Coba lagi beberapa saat lagi."
        primaryAction={{ href: '/login', label: 'Kembali ke login' }}
      />
    </div>
  );
}
