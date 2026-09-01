import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AppointmentCreateForm } from '@/components/dashboard/appointment-create-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { PERMISSIONS, requirePermission } from '@/lib/permissions';
import { getAppointmentFormOptions } from '@/server/queries/appointment-form-options';

export default async function NewAppointmentPage() {
  await requirePermission(PERMISSIONS.APPOINTMENT_CREATE);
  const { patientOptions, therapistOptions } = await getAppointmentFormOptions();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Appointment', href: '/dashboard/appointments' },
          { label: 'Buat Appointment' },
        ]}
      />
      <div>
        <Link
          href="/dashboard/appointments"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#92400e] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Appointment
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground md:text-3xl">Buat Appointment</h1>
        <p className="mt-2 text-muted-foreground">Buat jadwal terapi tanpa memasukkan catatan klinis.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Detail Jadwal</CardTitle>
        </CardHeader>
        <CardContent>
          <AppointmentCreateForm patientOptions={patientOptions} therapistOptions={therapistOptions} />
        </CardContent>
      </Card>
    </div>
  );
}
