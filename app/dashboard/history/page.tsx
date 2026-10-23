import Link from 'next/link';
import { ArrowUpRight, CalendarDays, ClipboardList, FileText } from 'lucide-react';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { IntakeHistoryActions } from '@/components/dashboard/intake-history-actions';
import { requireSession } from '@/lib/auth/require-session';
import { PERMISSIONS, requirePermission } from '@/lib/permissions';
import { getPatientVisibleIntakeHistory } from '@/server/queries/patient-intakes';

const STATUS_META: Record<
  string,
  { label: string; tone: string }
> = {
  DRAFT: { label: 'Draft', tone: 'bg-white text-stone-600 border-stone-200' },
  SUBMITTED: { label: 'Terkirim', tone: 'bg-[var(--hafta-ylw-50)]/70 text-[#181700] border-[var(--hafta-ylw-200)]' },
  UNDER_REVIEW: { label: 'Sedang ditinjau', tone: 'bg-[var(--hafta-ylw-50)]/70 text-[#181700] border-[var(--hafta-ylw-200)]' },
  NEEDS_REVISION: { label: 'Perlu perbaikan', tone: 'bg-[var(--hafta-red-50)] text-[var(--hafta-red-700)] border-[var(--hafta-red-200)]' },
  ACCEPTED: { label: 'Diterima', tone: 'bg-[var(--hafta-grn-50)] text-[var(--hafta-grn-700)] border-[var(--hafta-grn-200)]' },
  ARCHIVED: { label: 'Diarsipkan', tone: 'bg-stone-100 text-stone-500 border-stone-200' },
};

function formatDate(value: Date | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default async function HistoryPage() {
  const { session, role } = await requireSession({ redirectToLogin: true });
  await requirePermission(PERMISSIONS.INTAKE_READ);

  if (role !== 'USER') {
    return (
      <div className="space-y-6">
        <DashboardPageHeader
          title="Riwayat Terapi"
          description="Pilih pasien dari daftar pasien untuk melihat riwayat."
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Riwayat' },
          ]}
        />
      </div>
    );
  }

  const history = await getPatientVisibleIntakeHistory(session.user.id);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Riwayat Terapi"
        description="Semua Form Awal yang pernah Anda buat, termasuk episode keluhan sebelumnya."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Riwayat' },
        ]}
      />

      {history.length === 0 ? (
        <section className="flex flex-col items-center rounded-3xl border border-stone-200 bg-white px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--hafta-ylw-50)] text-[#181700]">
            <ClipboardList className="h-5 w-5" />
          </span>
          <h2 className="mt-4 text-sm font-bold text-[#181700]">Belum ada riwayat form</h2>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-stone-500">
            Form keluhan awal yang Anda kirim akan tercatat di sini sebagai riwayat episode terapi.
          </p>
          <Link
            href="/dashboard/intake"
            className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[var(--hafta-ylw-100)] px-5 text-xs font-bold text-[#181700] hover:bg-[var(--hafta-ylw-200)]"
          >
            Isi Form Awal
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </section>
      ) : (
        <section className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 border-b border-stone-200 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--hafta-ylw-50)] text-[#181700]">
                <FileText className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-[#181700]">Riwayat Form Awal</h2>
                <p className="text-xs text-stone-500">Satu form untuk setiap episode keluhan.</p>
              </div>
            </div>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-semibold text-stone-600">
              {history.length} form
            </span>
          </div>

          <div className="divide-y divide-stone-100">
            {history.map((item) => {
              const status = STATUS_META[item.status] ?? STATUS_META.SUBMITTED;
              const date = item.submittedAt ?? item.updatedAt;
              const isEditable = ['DRAFT', 'NEEDS_REVISION', 'SUBMITTED', 'UNDER_REVIEW'].includes(item.status);

              return (
                <article key={item.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                  <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-full bg-[var(--hafta-ylw-50)] text-[#181700]">
                    <span className="text-sm font-extrabold leading-none">{new Date(date).getDate()}</span>
                    <span className="mt-0.5 text-[9px] font-semibold uppercase">
                      {new Date(date).toLocaleDateString('id-ID', { month: 'short' })}
                    </span>
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-[#181700]">
                        {item.affectedArea || `Form Awal versi ${item.version}`}
                      </h3>
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${status.tone}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-stone-500">
                      {item.chiefComplaint || 'Tidak ada ringkasan keluhan.'}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-[11px] text-stone-400">
                      <CalendarDays className="h-3 w-3" />
                      {formatDate(date)} · Versi {item.version}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    {isEditable ? (
                      <Link
                        href="/dashboard/intake"
                        className="inline-flex h-8 items-center justify-center rounded-full bg-[var(--hafta-ylw-100)] px-3.5 text-[11px] font-bold text-[#181700] hover:bg-[var(--hafta-ylw-200)]"
                      >
                        Buka Form
                      </Link>
                    ) : null}
                    <IntakeHistoryActions
                      intakeId={item.id}
                      patientName={item.patientName}
                      submittedAt={item.submittedAt}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
