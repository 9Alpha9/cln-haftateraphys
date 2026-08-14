import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CreatePatientForm } from '@/components/dashboard/create-patient-form';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PERMISSIONS, requirePermission } from '@/lib/permissions';
import { getUnlinkedUserPatients } from '@/server/queries/patients';

export default async function NewPatientPage() {
  await requirePermission(PERMISSIONS.PATIENT_CREATE);
  const userOptions = await getUnlinkedUserPatients();
  return (
    <>
      <div className="mx-auto max-w-7xl space-y-6">
        <DashboardPageHeader
          title="Tambah Pasien"
          description="Hubungkan akun USER yang telah terdaftar dengan record pasien."
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Pasien', href: '/dashboard/patients' },
            { label: 'Tambah Pasien' },
          ]}
          action={
            <Link
              href="/dashboard/patients"
              className="inline-flex h-10 items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" /> Kembali
            </Link>
          }
        />
        <Card>
          <CardHeader>
            <CardTitle>Pilih Akun Pasien</CardTitle>
          </CardHeader>
          <CardContent>
            <CreatePatientForm userOptions={userOptions} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
