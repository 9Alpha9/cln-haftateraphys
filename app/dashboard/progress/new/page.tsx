import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { PERMISSIONS, requirePermission } from '@/lib/permissions';
import { TherapyProgressForm } from '@/components/dashboard/therapy-progress-form';
import { getAppointmentFormOptions } from '@/server/queries/appointment-form-options';

export default async function NewProgressPage() {
  await requirePermission(PERMISSIONS.PROGRESS_READ);
  const { patientOptions } = await getAppointmentFormOptions();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Rekam Medis', href: '/dashboard/progress' },
          { label: 'Tambah Evaluasi' },
        ]}
      />
      <div>
        <Link
          href="/dashboard/progress"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#92400e] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Rekam Medis
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground md:text-3xl">Tambah Evaluasi</h1>
        <p className="mt-2 text-muted-foreground">Catat data progress klinis.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Form Evaluasi</CardTitle>
        </CardHeader>
        <CardContent>
          <TherapyProgressForm patientOptions={patientOptions} />
        </CardContent>
      </Card>
    </div>
  );
}
