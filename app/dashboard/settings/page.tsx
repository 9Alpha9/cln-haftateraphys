import Link from 'next/link';
import { Settings, Wrench } from 'lucide-react';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { SettingsForm } from '@/components/dashboard/settings-form';
import { PERMISSIONS, requirePermission } from '@/lib/permissions';
import { isEmailConfigured } from '@/lib/email/send-email';
import { isR2Configured } from '@/lib/storage/r2';
import { getAppSettings } from '@/server/queries/app-settings';
import { getMaintenanceFlags } from '@/lib/maintenance';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  await requirePermission(PERMISSIONS.SETTINGS_MANAGE);
  const [settings, maintenance] = await Promise.all([getAppSettings(), getMaintenanceFlags({ fresh: true })]);

  return (
    <div className="space-y-4 sm:space-y-5">
      <DashboardPageHeader
        title="Pengaturan"
        description="Kelola konfigurasi umum, pengingat, dan status integrasi sistem."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Pengaturan' }]}
        icon={<Settings className="h-7 w-7 text-white" />}
      />
      <section
        className={`flex flex-col gap-3 rounded-3xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
          maintenance.enabled
            ? 'border-amber-200 bg-amber-50'
            : 'border-stone-200 bg-white'
        }`}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#181700] ring-1 ring-stone-200">
            <Wrench className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-bold text-[#181700]">
              Mode pemeliharaan: {maintenance.enabled ? 'aktif' : 'tidak aktif'}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-stone-600">
              {maintenance.enabled
                ? 'Pengguna selain Super Admin diarahkan ke halaman pemeliharaan.'
                : 'Situs dapat diakses semua pengguna sesuai izinnya.'}
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/maintenance"
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-stone-300 bg-white px-4 text-xs font-bold text-[#181700] transition-colors hover:bg-stone-50"
        >
          Kelola pemeliharaan
        </Link>
      </section>

      <SettingsForm
        initial={settings}
        emailConfigured={isEmailConfigured()}
        r2Configured={isR2Configured()}
      />
    </div>
  );
}
