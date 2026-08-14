import { Settings, Shield, Database, Bell } from 'lucide-react';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PERMISSIONS, requirePermission } from '@/lib/permissions';

export default async function SettingsPage() {
  await requirePermission(PERMISSIONS.SETTINGS_MANAGE);
  const items = [
    {
      title: 'Keamanan',
      text: 'Pengaturan keamanan dan autentikasi',
      note: 'MFA untuk staff akan diimplementasikan sebelum production',
      icon: Shield,
    },
    {
      title: 'Database',
      text: 'Backup dan pengaturan database',
      note: 'Backup policy akan ditentukan sebelum production',
      icon: Database,
    },
    {
      title: 'Notifikasi',
      text: 'Pengaturan email dan notifikasi',
      note: 'Email provider akan dikonfigurasi sebelum production',
      icon: Bell,
    },
    { title: 'Umum', text: 'Pengaturan umum aplikasi', icon: Settings },
  ];
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <DashboardPageHeader
        title="Pengaturan"
        description="Kelola konfigurasi sistem yang tersedia."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Pengaturan' }]}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <Card key={item.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold">{item.title}</CardTitle>
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{item.text}</p>
              {item.note ? <p className="mt-2 text-xs text-muted-foreground">{item.note}</p> : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
