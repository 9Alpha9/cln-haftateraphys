import Link from 'next/link';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { CreateUserForm } from '@/components/dashboard/create-user-form';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PERMISSIONS, requirePermission } from '@/lib/permissions';

export default async function NewPatientPage() {
  await requirePermission(PERMISSIONS.PATIENT_CREATE);
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <DashboardPageHeader
        title="Daftarkan Pasien"
        description="Buat akun portal untuk pasien baru."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Pasien', href: '/dashboard/patients' },
          { label: 'Daftarkan Pasien' },
        ]}
        icon={<UserPlus className="h-7 w-7 text-white" />}
        action={
          <Link
            href="/dashboard/patients"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" /> Pasien
          </Link>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Detail Akun</CardTitle>
          <CardDescription>
            Akun yang dibuat akan memiliki role Pasien dan otomatis terhubung ke record pasien.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateUserForm canCreateStaffAccounts={false} />
        </CardContent>
      </Card>
    </div>
  );
}
