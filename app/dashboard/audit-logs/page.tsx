import { Terminal, AlertCircle, Info, CheckCircle, XCircle } from 'lucide-react';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { Card, CardContent } from '@/components/ui/card';
import { PERMISSIONS, requirePermission } from '@/lib/permissions';
import { getAuditLogs } from '@/server/queries/audit-logs';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

function getActionIcon(action: string) {
  if (action.includes('ERROR') || action.includes('FAIL') || action.includes('REJECT')) {
    return <XCircle className="h-4 w-4 text-red-500" />;
  }
  if (action.includes('CREATE') || action.includes('SUBMIT') || action.includes('ACCEPT')) {
    return <CheckCircle className="h-4 w-4 text-emerald-500" />;
  }
  if (action.includes('UPDATE') || action.includes('EDIT') || action.includes('ASSIGN')) {
    return <Info className="h-4 w-4 text-blue-500" />;
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
    return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  }
  if (action.includes('UPDATE') || action.includes('EDIT') || action.includes('ASSIGN')) {
    return 'text-blue-600 bg-blue-50 border-blue-200';
  }
  if (action.includes('DELETE') || action.includes('CANCEL') || action.includes('SUSPEND') || action.includes('ARCHIVE')) {
    return 'text-amber-600 bg-amber-50 border-amber-200';
  }
  if (action.includes('LOGIN') || action.includes('LOGOUT')) {
    return 'text-violet-600 bg-violet-50 border-violet-200';
  }
  return 'text-slate-600 bg-slate-50 border-slate-200';
}

function formatMeta(meta: Record<string, unknown> | null): string {
  if (!meta) return '';
  const entries = Object.entries(meta);
  if (entries.length === 0) return '';
  return entries.map(([key, value]) => `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`).join(', ');
}

export default async function AuditLogsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requirePermission(PERMISSIONS.AUDIT_READ);
  const params = await searchParams;
  const result = await getAuditLogs(Number(params.page) || 1);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <DashboardPageHeader
        title="Log Audit"
        description="Pantau aktivitas dan perubahan data sistem."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Log Audit' }]}
      />
      <Card className="border-border/60 bg-white overflow-hidden">
        <CardContent className="p-0">
          {result.items.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center p-6 text-center">
              <Terminal className="h-10 w-10 text-muted-foreground/50" />
              <p className="mt-4 font-medium text-foreground">Belum ada log audit</p>
              <p className="mt-1 text-sm text-muted-foreground">Aktivitas sistem akan tercatat di sini.</p>
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
      {result.total > result.pageSize && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              {result.page > 1 ? (
                <PaginationPrevious href={`/dashboard/audit-logs?page=${result.page - 1}`}>
                  Sebelumnya
                </PaginationPrevious>
              ) : null}
            </PaginationItem>
            {Array.from({ length: Math.min(result.totalPages, 5) }, (_, index) => index + 1).map((item) => (
              <PaginationItem key={item}>
                <PaginationLink
                  href={`/dashboard/audit-logs?page=${item}`}
                  isActive={item === result.page}
                >
                  {item}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              {result.page < result.totalPages ? (
                <PaginationNext href={`/dashboard/audit-logs?page=${result.page + 1}`}>
                  Berikutnya
                </PaginationNext>
              ) : null}
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
