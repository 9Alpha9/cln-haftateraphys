import { FileText } from 'lucide-react';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PERMISSIONS, requirePermission } from '@/lib/permissions';

export default async function AuditLogsPage() {
  await requirePermission(PERMISSIONS.AUDIT_READ);
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <DashboardPageHeader
        title="Log Audit"
        description="Pantau aktivitas dan perubahan data."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Log Audit' }]}
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Audit Log</CardTitle>
          <Button variant="outline">Filter</Button>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-48 flex-col items-center justify-center text-center">
            <FileText className="h-10 w-10 text-primary/70" />
            <p className="mt-4 font-semibold text-foreground">Belum ada log audit</p>
            <p className="mt-2 text-sm text-muted-foreground">Aktivitas akan tercatat di sini.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
