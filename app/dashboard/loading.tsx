import { requireSession } from '@/lib/auth/require-session';
import {
  PatientDashboardSkeleton,
  StaffDashboardSkeleton,
} from '@/components/dashboard/skeletons/dashboard-overview-skeleton';

export default async function DashboardLoading() {
  const { role } = await requireSession({ redirectToLogin: true });

  if (role === 'USER') return <PatientDashboardSkeleton />;
  return <StaffDashboardSkeleton />;
}
