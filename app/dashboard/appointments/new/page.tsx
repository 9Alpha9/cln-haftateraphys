import Link from 'next/link';
import { ArrowLeft, CalendarPlus } from 'lucide-react';
import { AppointmentCreateForm } from '@/components/dashboard/appointment-create-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { PERMISSIONS, requirePermission } from '@/lib/permissions';
import { getAppointmentFormOptions } from '@/server/queries/appointment-form-options';

export default async function NewAppointmentPage() {
  await requirePermission(PERMISSIONS.APPOINTMENT_CREATE);
  const { patientOptions, therapistOptions } = await getAppointmentFormOptions();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Buat Appointment"
        description="Buat jadwal terapi tanpa memasukkan catatan klinis."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Appointment', href: '/dashboard/appointments' },
          { label: 'Buat Appointment' },
        ]}
        icon={<CalendarPlus className="h-7 w-7 text-white" />}
        action={
          <Link
            href="/dashboard/appointments"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" /> Appointment
          </Link>
        }
      />
      <div className="mx-auto max-w-7xl">
        <Card>
          <CardHeader>
            <CardTitle>Detail Jadwal</CardTitle>
          </CardHeader>
          <CardContent>
            <AppointmentCreateForm patientOptions={patientOptions} therapistOptions={therapistOptions} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
