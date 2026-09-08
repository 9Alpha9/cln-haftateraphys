import Link from 'next/link';
import { ArrowLeft, ClipboardPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { PERMISSIONS, requirePermission } from '@/lib/permissions';
import { TherapyProgressForm } from '@/components/dashboard/therapy-progress-form';
import { getAppointmentFormOptions } from '@/server/queries/appointment-form-options';

export default async function NewProgressPage() {
  await requirePermission(PERMISSIONS.PROGRESS_READ);
  const { patientOptions } = await getAppointmentFormOptions();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Tambah Evaluasi"
        description="Catat data progress klinis."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Rekam Medis', href: '/dashboard/progress' },
          { label: 'Tambah Evaluasi' },
        ]}
        icon={<ClipboardPlus className="h-7 w-7 text-white" />}
        action={
          <Link
            href="/dashboard/progress"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" /> Rekam Medis
          </Link>
        }
      />
      <div className="mx-auto max-w-7xl">
        <Card>
          <CardHeader>
            <CardTitle>Form Evaluasi</CardTitle>
          </CardHeader>
          <CardContent>
            <TherapyProgressForm patientOptions={patientOptions} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
