'use client';

import { usePathname } from 'next/navigation';
import { ErrorState } from '@/components/errors/error-state';

export default function DashboardNotFound() {
  const pathname = usePathname();

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-8">
      <ErrorState
        compact
        code={404}
        pathname={pathname}
        homeHref="/dashboard"
        description="Halaman panel ini tidak tersedia atau Anda tidak memiliki akses ke alamat tersebut. Periksa kembali menu yang tersedia untuk peran akun Anda."
        primaryAction={{ href: '/dashboard', label: 'Kembali ke dashboard' }}
      />
    </div>
  );
}
