import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth/require-session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { getMaintenanceFlags } from '@/lib/maintenance';
import { MaintenanceConsole } from '@/components/dashboard/maintenance/maintenance-console';

export const dynamic = 'force-dynamic';

export default async function MaintenancePage() {
  const { role } = await requireSession({ redirectToLogin: true });
  if (!hasPermission(role, PERMISSIONS.SETTINGS_MANAGE)) redirect('/dashboard');

  const flags = await getMaintenanceFlags({ fresh: true });

  return <MaintenanceConsole initial={flags} />;
}
