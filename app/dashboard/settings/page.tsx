import { Settings } from 'lucide-react';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { SettingsForm } from '@/components/dashboard/settings-form';
import { PERMISSIONS, requirePermission } from '@/lib/permissions';
import { isEmailConfigured } from '@/lib/email/send-email';
import { isR2Configured } from '@/lib/storage/r2';
import { getAppSettings } from '@/server/queries/app-settings';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  await requirePermission(PERMISSIONS.SETTINGS_MANAGE);
  const settings = await getAppSettings();

  return (
    <div className="space-y-4 sm:space-y-5">
      <DashboardPageHeader
        title="Pengaturan"
        description="Kelola konfigurasi umum, pengingat, dan status integrasi sistem."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Pengaturan' }]}
        icon={<Settings className="h-7 w-7 text-white" />}
      />
      <SettingsForm
        initial={settings}
        emailConfigured={isEmailConfigured()}
        r2Configured={isR2Configured()}
      />
    </div>
  );
}
