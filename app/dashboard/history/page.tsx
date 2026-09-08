import { ClipboardList, FileText, Calendar } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { requireSession } from '@/lib/auth/require-session';
import { PERMISSIONS, requirePermission } from '@/lib/permissions';
import { getPatientVisibleIntakeHistory } from '@/server/queries/patient-intakes';
import { IntakeHistoryActions } from '@/components/dashboard/intake-history-actions';

const statusConfig = {
  SUBMITTED: { label: 'Terkirim', color: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
  UNDER_REVIEW: { label: 'Ditinjau', color: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
  NEEDS_REVISION: { label: 'Perlu Revisi', color: 'bg-red-50 text-red-700 ring-red-600/20' },
  ACCEPTED: { label: 'Diterima', color: 'bg-blue-50 text-blue-700 ring-blue-600/20' },
  ARCHIVED: { label: 'Diarsipkan', color: 'bg-slate-50 text-slate-500 ring-slate-500/20' },
} as const;

export default async function HistoryPage() {
  const { session, role } = await requireSession({ redirectToLogin: true });
  await requirePermission(PERMISSIONS.INTAKE_READ);
  if (role !== 'USER')
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Riwayat' }]} />
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Riwayat Terapi</h1>
        <p className="text-muted-foreground">Pilih pasien dari daftar pasien untuk melihat riwayat.</p>
      </div>
    );

  const history = await getPatientVisibleIntakeHistory(session.user.id);

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div>
        <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Riwayat' }]} />
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground md:text-3xl">Riwayat Terapi</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
          Daftar Form Awal pemeriksaan yang telah Anda kirim.
        </p>
      </div>

      {history.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 text-center">
          <ClipboardList className="h-10 w-10 text-muted-foreground/50" />
          <p className="mt-4 text-sm font-medium text-muted-foreground">Belum ada riwayat yang dapat ditampilkan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {history.map((item) => {
            const status = statusConfig[item.status as keyof typeof statusConfig] ?? statusConfig.SUBMITTED;
            const date = item.submittedAt ?? item.updatedAt;

            return (
              <div
                key={item.id}
                className="group flex flex-col rounded-xl border border-border bg-white p-4 shadow-xs transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                    <FileText className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${status.color}`}>
                    {status.label}
                  </span>
                </div>

                <div className="mt-3 min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-foreground">
                    Form Awal
                  </h3>
                  {item.affectedArea && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.affectedArea}</p>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 shrink-0" />
                  <span>
                    {date
                      ? new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '-'}
                  </span>
                </div>

                <div className="mt-3 border-t border-border pt-3">
                  <IntakeHistoryActions
                    intakeId={item.id}
                    patientName={item.patientName}
                    submittedAt={item.submittedAt}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
