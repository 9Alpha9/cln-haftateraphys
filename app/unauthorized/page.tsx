import type { Metadata } from 'next';
import { ErrorState } from '@/components/errors/error-state';

export const metadata: Metadata = {
  title: 'Sesi Berakhir',
  robots: { index: false, follow: false },
};

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-[#FCFCFB] px-4 py-10 sm:px-6">
      <ErrorState
        code={401}
        primaryAction={{ href: '/login', label: 'Masuk kembali' }}
        description="Sesi Anda tidak ditemukan atau sudah berakhir. Masuk kembali untuk melanjutkan dengan aman."
      />
    </div>
  );
}
