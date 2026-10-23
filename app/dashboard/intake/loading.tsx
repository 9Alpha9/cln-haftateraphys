import { requireSession } from '@/lib/auth/require-session';
import { RouteSkeleton } from '@/components/dashboard/skeletons/route-skeletons';

export default async function IntakeLoading() {
  const { role } = await requireSession({ redirectToLogin: true });

  if (role === 'USER') return <RouteSkeleton variant="patient-intake" />;
  return <RouteSkeleton variant="intake" />;
}
