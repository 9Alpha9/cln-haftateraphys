import { Monitor } from 'lucide-react';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { SessionManager } from '@/components/dashboard/session-manager';
import { requireSession } from '@/lib/auth/require-session';

/**
 * Halaman mandiri "Perangkat & Sesi" — dipisahkan dari tab Keamanan agar
 * informasi perangkat & IP tampil sebagai entri tersendiri di navigasi.
 * Daftar dikelompokkan per perangkat (userAgent) + alamat IP oleh
 * `listUserSessions`, bukan per waktu login.
 */
export default async function SessionsPage() {
  await requireSession({ redirectToLogin: true });

  return (
    <div className="space-y-4 sm:space-y-5">
      <DashboardPageHeader
        title="Perangkat & Sesi"
        description="Perangkat yang masuk ke akun Anda — dideteksi dari perangkat (browser) dan alamat IP, bukan hanya dari jam login."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Perangkat & Sesi' }]}
        icon={<Monitor className="h-6 w-6" />}
      />
      <section className="hafta-card p-4 sm:p-5">
        <SessionManager />
      </section>
    </div>
  );
}
