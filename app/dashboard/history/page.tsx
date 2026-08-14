import { ClipboardList } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PrintButton } from '@/components/ui/print-button';
import { requireSession } from '@/lib/auth/require-session';
import { PERMISSIONS, requirePermission } from '@/lib/permissions';
import { getPatientVisibleIntakeHistory } from '@/server/queries/patient-intakes';

const statusLabel = {
  SUBMITTED: 'Terkirim',
  UNDER_REVIEW: 'Sedang Ditinjau',
  NEEDS_REVISION: 'Perlu Perbaikan',
  ACCEPTED: 'Diterima',
  ARCHIVED: 'Diarsipkan',
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
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Riwayat' }]} />
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground md:text-3xl">Riwayat Terapi</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Ringkasan Form Awal yang dapat Anda lihat dan cetak.
          </p>
        </div>
        {history.length > 0 ? <PrintButton /> : null}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Form Awal</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center text-center">
              <ClipboardList className="h-10 w-10 text-primary/70" />
              <p className="mt-4 font-semibold text-foreground">Belum ada riwayat yang dapat ditampilkan.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-foreground">
                      Form Awal{item.affectedArea ? ` · ${item.affectedArea}` : ''}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.submittedAt
                        ? `Dikirim ${item.submittedAt.toLocaleDateString('id-ID')}`
                        : `Diperbarui ${item.updatedAt.toLocaleDateString('id-ID')}`}
                    </p>
                  </div>
                  <span className="w-fit rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    {statusLabel[item.status as keyof typeof statusLabel]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
