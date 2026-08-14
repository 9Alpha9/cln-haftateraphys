import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChangePasswordForm } from '@/components/dashboard/change-password-form';

export default function SecurityPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <DashboardPageHeader
        title="Keamanan Akun"
        description="Kelola keamanan akun dan sesi aktif Anda."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Keamanan' }]}
      />
      <Card>
        <CardHeader>
          <CardTitle>Ubah Password</CardTitle>
          <CardDescription>
            Ganti kata sandi akun Anda. Sesi lain akan diminta masuk kembali.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Sesi Aktif</CardTitle>
          <CardDescription>Informasi sesi aktif Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Setiap perubahan kata sandi akan menonaktifkan sesi login lainnya demi keamanan.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
