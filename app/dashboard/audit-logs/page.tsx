import { Terminal, AlertCircle, Info, CheckCircle, XCircle } from 'lucide-react';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { Card, CardContent } from '@/components/ui/card';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { PERMISSIONS, requirePermission } from '@/lib/permissions';
import { getAuditLogs } from '@/server/queries/audit-logs';

function getActionIcon(action: string) {
  if (action.includes('ERROR') || action.includes('FAIL') || action.includes('REJECT')) {
    return <XCircle className="h-4 w-4 text-red-500" />;
  }
  if (action.includes('CREATE') || action.includes('SUBMIT') || action.includes('ACCEPT')) {
    return <CheckCircle className="h-4 w-4 text-[#f59e0b]" />;
  }
  if (action.includes('UPDATE') || action.includes('EDIT') || action.includes('ASSIGN')) {
    return <Info className="h-4 w-4 text-[#ea580c]" />;
  }
  if (action.includes('DELETE') || action.includes('CANCEL') || action.includes('SUSPEND') || action.includes('ARCHIVE')) {
    return <AlertCircle className="h-4 w-4 text-amber-500" />;
  }
  return <Terminal className="h-4 w-4 text-muted-foreground" />;
}

function getActionColor(action: string) {
  if (action.includes('ERROR') || action.includes('FAIL') || action.includes('REJECT')) {
    return 'text-red-600 bg-red-50 border-red-200';
  }
  if (action.includes('CREATE') || action.includes('SUBMIT') || action.includes('ACCEPT')) {
    return 'text-[#92400e] bg-accent/15 border-accent/30';
  }
  if (action.includes('UPDATE') || action.includes('EDIT') || action.includes('ASSIGN')) {
    return 'text-[#92400e] bg-accent/15 border-accent/30';
  }
  if (action.includes('DELETE') || action.includes('CANCEL') || action.includes('SUSPEND') || action.includes('ARCHIVE')) {
    return 'text-amber-600 bg-amber-50 border-amber-200';
  }
  if (action.includes('LOGIN') || action.includes('LOGOUT')) {
    return 'text-[#92400e] bg-accent/15 border-accent/30';
  }
  return 'text-stone-600 bg-stone-50 border-stone-200';
}

function formatMeta(meta: Record<string, unknown> | null): string {
  if (!meta) return '';
  const entries = Object.entries(meta);
  if (entries.length === 0) return '';
  return entries.map(([key, value]) => `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`).join(', ');
}

export default async function AuditLogsPage({ searchParams }: { searchParams: Promise<{ page?: string; perPage?: string }> }) {
  await requirePermission(PERMISSIONS.AUDIT_READ);
  const params = await searchParams;
  const perPageParam = Number(params.perPage);
  const perPage = [10, 25, 50, 100].includes(perPageParam) ? perPageParam : 10;
  const result = await getAuditLogs(Number(params.page) || 1, perPage);

  return (
    <div className="space-y-4 sm:space-y-5">
      <DashboardPageHeader
        title="Log Audit"
        description="Pantau aktivitas dan perubahan data sistem."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Log Audit' }]}
        icon={<Terminal className="h-7 w-7 text-white" />}
      />
      <Card className="border-border/60 bg-white overflow-hidden">
        <CardContent className="p-0">
          {result.items.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center p-3.5 text-center sm:p-5">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--hafta-ylw-50)] text-[#181700]">
                <Terminal className="h-6 w-6" />
              </span>
              <p className="mt-3 text-sm font-bold text-[#181700]">Belum ada log audit</p>
              <p className="mt-1 max-w-sm text-xs text-stone-500">Aktivitas sistem akan tercatat di sini.</p>
            </div>
          ) : (
            <div className="max-h-[900px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 border-b border-border/60 bg-white">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Waktu</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Aksi</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Oleh</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Target</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {result.items.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-xs text-muted-foreground">
                          {log.createdAt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="text-xs text-muted-foreground/70">
                          {log.createdAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium ${getActionColor(log.action)}`}>
                          {getActionIcon(log.action)}
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{log.actorName ?? 'System'}</div>
                        {log.actorEmail && (
                          <div className="text-xs text-muted-foreground">{log.actorEmail}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {log.targetType ? (
                          <span>
                            {log.targetType}
                            {log.targetId && <span className="text-muted-foreground/60">#{log.targetId.slice(0, 8)}</span>}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {log.meta && Object.keys(log.meta).length > 0 ? (
                          <div className="max-w-xs truncate text-xs text-muted-foreground" title={formatMeta(log.meta)}>
                            {formatMeta(log.meta)}
                          </div>
                        ) : log.ipAddress ? (
                          <div className="text-xs text-muted-foreground/70">IP: {log.ipAddress}</div>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      <PaginationBar
        page={result.page}
        pageCount={result.totalPages}
        hrefTemplate={`/dashboard/audit-logs?page={page}&perPage=${perPage}`}
        pageSize={perPage}
        pageSizeOptions={[10, 25, 50, 100]}
        pageSizeHrefTemplate="/dashboard/audit-logs?page=1&perPage={size}"
      />
    </div>
  );
}
