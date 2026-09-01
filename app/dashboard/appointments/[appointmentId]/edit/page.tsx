import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import { AppointmentEditForm } from '@/components/dashboard/appointment-edit-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumb } from '@/components/ui/breadcrumb';
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
    <div className="mx-auto max-w-7xl space-y-6">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Appointment', href: '/dashboard/appointments' },
          { label: 'Edit Appointment' },
        ]}
      />
      <div>
        <Link
          href="/dashboard/appointments"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#92400e] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Appointment
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground md:text-3xl">Edit Appointment</h1>
        <p className="mt-2 text-muted-foreground">Perbarui jadwal terapi.</p>
      </div>
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
  );
}
