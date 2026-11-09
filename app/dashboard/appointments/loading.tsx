import { requireSession } from '@/lib/auth/require-session';
import { RouteSkeleton } from '@/components/dashboard/skeletons/route-skeletons';

export default async function AppointmentsLoading() {
  let isPatient = false;
  try {
    const { role } = await requireSession({ redirectToLogin: false });
    isPatient = role === 'USER';
  } catch {
    isPatient = false;
  }

  return <RouteSkeleton variant={isPatient ? 'patient-appointments' : 'appointments'} />;
}
