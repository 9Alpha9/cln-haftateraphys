import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth/require-session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { MaintenanceConsole } from '@/components/dashboard/maintenance/maintenance-console';

export default async function MaintenancePage() {
  const { role } = await requireSession({ redirectToLogin: true });
  if (!hasPermission(role, PERMISSIONS.SETTINGS_MANAGE)) redirect('/dashboard');

  return <MaintenanceConsole />;
}
