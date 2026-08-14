import { ChartNoAxesCombined } from 'lucide-react';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { requireSession } from '@/lib/auth/require-session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { Card, CardContent } from '@/components/ui/card';

export default async function ProgressPage() {
  const { role } = await requireSession({ redirectToLogin: true });
  const permission = role === 'USER' ? PERMISSIONS.PROGRESS_READ_OWN : PERMISSIONS.PROGRESS_READ;
  if (!hasPermission(role, permission)) return null;
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <DashboardPageHeader
        title="Progress Terapi"
        description="Ringkasan perkembangan akan memakai data evaluasi yang memang dapat Anda akses."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Progress' }]}
      />
      <Card>
        <CardContent className="flex min-h-64 flex-col items-center justify-center p-6 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <ChartNoAxesCombined className="h-6 w-6 text-primary" />
          </span>
          <h2 className="mt-4 font-semibold text-foreground">Belum ada data progress</h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            Progress akan muncul setelah terdapat data evaluasi yang dapat ditampilkan. Kami tidak menampilkan estimasi
            atau skor klinis tanpa data yang valid.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
