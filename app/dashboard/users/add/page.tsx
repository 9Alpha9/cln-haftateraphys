import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CreateUserForm } from '@/components/dashboard/create-user-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { PERMISSIONS, requirePermission } from '@/lib/permissions';
import { requireSession } from '@/lib/auth/require-session';

export default async function AddUserPage() {
  await requirePermission(PERMISSIONS.USER_CREATE);
  const { role } = await requireSession({ redirectToLogin: true });
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const backHref = isSuperAdmin ? '/dashboard/users' : '/dashboard/patients';
  const backLabel = isSuperAdmin ? 'Kembali ke Manajemen Pengguna' : 'Kembali ke Pasien';

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: isSuperAdmin ? 'Pengguna' : 'Pasien', href: backHref },
          { label: isSuperAdmin ? 'Tambah Pengguna' : 'Daftarkan Pasien' },
        ]}
      />
      <div>
        <Link
          href={backHref}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#92400e] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> {backLabel}
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          {isSuperAdmin ? 'Tambah Pengguna' : 'Daftarkan Pasien'}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {isSuperAdmin ? 'Buat akun pengguna baru.' : 'Buat akun portal untuk pasien baru.'}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Detail Akun</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateUserForm canCreateStaffAccounts={isSuperAdmin} />
        </CardContent>
      </Card>
    </div>
  );
}
