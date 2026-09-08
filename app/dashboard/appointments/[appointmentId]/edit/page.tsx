import Link from 'next/link';
import { ArrowLeft, Pencil } from 'lucide-react';
import { notFound } from 'next/navigation';
import { AppointmentEditForm } from '@/components/dashboard/appointment-edit-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { PERMISSIONS, requirePermission } from '@/lib/permissions';
import { getAppointmentById } from '@/server/queries/appointments';
import { getAppointmentFormOptions } from '@/server/queries/appointment-form-options';

export default async function EditAppointmentPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  await requirePermission(PERMISSIONS.APPOINTMENT_UPDATE);
  const { appointmentId } = await params;
  const [appointment, { therapistOptions }] = await Promise.all([
    getAppointmentById(appointmentId),
    getAppointmentFormOptions(),
  ]);

  if (!appointment) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Edit Appointment"
        description="Perbarui jadwal terapi."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Appointment', href: '/dashboard/appointments' },
          { label: 'Edit Appointment' },
        ]}
        icon={<Pencil className="h-7 w-7 text-white" />}
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
            <AppointmentEditForm
              appointment={appointment}
              therapistOptions={therapistOptions}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
