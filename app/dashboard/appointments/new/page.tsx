import { redirect } from 'next/navigation';
import { PERMISSIONS, requirePermission } from '@/lib/permissions';

export default async function NewAppointmentPage() {
  await requirePermission(PERMISSIONS.APPOINTMENT_CREATE);
  redirect('/dashboard/appointments');
}
