import Link from 'next/link';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { CreateUserForm } from '@/components/dashboard/create-user-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { PERMISSIONS, requirePermission } from '@/lib/permissions';
import { requireSession } from '@/lib/auth/require-session';

export default async function AddUserPage() {
  await requirePermission(PERMISSIONS.USER_CREATE);
  const { role } = await requireSession({ redirectToLogin: true });
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const backHref = isSuperAdmin ? '/dashboard/users' : '/dashboard/patients';
  const backLabel = isSuperAdmin ? 'Manajemen Pengguna' : 'Pasien';

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={isSuperAdmin ? 'Tambah Pengguna' : 'Daftarkan Pasien'}
        description={isSuperAdmin ? 'Buat akun pengguna baru.' : 'Buat akun portal untuk pasien baru.'}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: isSuperAdmin ? 'Pengguna' : 'Pasien', href: backHref },
          { label: isSuperAdmin ? 'Tambah Pengguna' : 'Daftarkan Pasien' },
        ]}
        icon={<UserPlus className="h-7 w-7 text-white" />}
        action={
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" /> {backLabel}
          </Link>
        }
      />
      <div className="mx-auto max-w-7xl">
        <Card>
          <CardHeader>
            <CardTitle>Detail Akun</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateUserForm canCreateStaffAccounts={isSuperAdmin} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
