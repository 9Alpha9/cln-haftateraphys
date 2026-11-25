import { Activity, CalendarDays, ClipboardList, FileText } from 'lucide-react';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { IntakeHistoryActions } from '@/components/dashboard/intake-history-actions';
import { requireSession } from '@/lib/auth/require-session';
import { PERMISSIONS, requirePermission } from '@/lib/permissions';
import { getPatientVisibleIntakeHistory } from '@/server/queries/patient-intakes';
import { getScopedTherapyProgress } from '@/server/queries/therapy-progress';

const STATUS_META: Record<
  string,
  { label: string; tone: string }
> = {
  DRAFT: { label: 'Draft', tone: 'bg-white text-stone-600 border-stone-200' },
  SUBMITTED: { label: 'Terkirim', tone: 'bg-[var(--hafta-org-50)]/70 text-[#181700] border-[var(--hafta-org-200)]' },
  UNDER_REVIEW: { label: 'Sedang ditinjau', tone: 'bg-[var(--hafta-org-50)]/70 text-[#181700] border-[var(--hafta-org-200)]' },
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
      <div className="space-y-4 sm:space-y-5">
        <DashboardPageHeader
          title="Riwayat Terapi"
          description="Pilih pasien dari daftar pasien untuk melihat riwayat."
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Riwayat' },
          ]}
          icon={<CalendarDays className="h-6 w-6" />}
        />
      </div>
    );
  }

  const history = await getPatientVisibleIntakeHistory(session.user.id);
  const { items: therapyResults } = await getScopedTherapyProgress({ page: 1, pageSize: 50 });

  // Penomoran sesi per TANGGAL kunjungan — amandemen memakai tanggal rekam
  // aslinya sehingga tidak menambah nomor. Revisi terbaru menang, jadi satu
  // kunjungan tampil satu baris. Konsisten dengan halaman Rekam Medis.
  const visitNumberByDate = new Map<string, number>();
  const latestByDate = new Map<string, (typeof therapyResults)[number]>();
  const sortedResults = [...therapyResults].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
  );
  for (const record of sortedResults) {
    const date = new Date(record.recordedAt);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    if (!visitNumberByDate.has(key)) visitNumberByDate.set(key, visitNumberByDate.size + 1);
    const current = latestByDate.get(key);
    if (!current) {
      latestByDate.set(key, record);
    } else {
      const currentAt = new Date(current.recordedAt).getTime();
      const recordAt = date.getTime();
      if (recordAt > currentAt || (recordAt === currentAt && (record.revisionNumber ?? 1) >= (current.revisionNumber ?? 1))) {
        latestByDate.set(key, record);
      }
    }
  }
  const therapyHistory = Array.from(latestByDate.values()).sort(
    (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
  );
  const visitNumberById = new Map<string, number>();
  for (const record of therapyHistory) {
    const date = new Date(record.recordedAt);
    visitNumberById.set(
      record.id,
      visitNumberByDate.get(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`) ?? 1,
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <DashboardPageHeader
        title="Riwayat Terapi"
        description="Hasil evaluasi terapi dari fisioterapis Anda beserta riwayat episode keluhan yang pernah dilaporkan."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Riwayat' },
        ]}
        icon={<CalendarDays className="h-6 w-6" />}
      />

      {/* ── Hasil Terapi: evaluasi yang dibagikan fisioterapis ── */}
      <section className="rounded-3xl border border-stone-200 bg-white p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 border-b border-stone-200 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--hafta-org-50)] text-[#181700]">
              <Activity className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-[#181700]">Hasil Terapi</h2>
              <p className="text-xs text-stone-500">
                Evaluasi sesi yang dibagikan fisioterapis kepada Anda.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-semibold text-stone-600">
            {therapyHistory.length} sesi
          </span>
        </div>

        {therapyHistory.length === 0 ? (
          <p className="py-6 text-center text-xs leading-relaxed text-stone-500">
            Belum ada hasil terapi. Evaluasi fisioterapis akan tampil di sini setelah sesi selesai
            dibagikan.
          </p>
        ) : (
          <div className="divide-y divide-stone-100">
            {therapyHistory.map((record) => (
              <article key={record.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start">
                <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-full bg-[var(--hafta-org-50)] text-[#181700]">
                  <span className="text-sm font-extrabold leading-none">
                    {new Date(record.recordedAt).getDate()}
                  </span>
                  <span className="mt-0.5 text-[9px] font-semibold uppercase">
                    {new Date(record.recordedAt).toLocaleDateString('id-ID', { month: 'short' })}
                  </span>
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-[#181700]">
                      {`Evaluasi Sesi ${visitNumberById.get(record.id) ?? 1}`}
                    </h3>
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
                        record.status === 'FINALIZED'
                          ? 'border-[var(--hafta-grn-200)] bg-[var(--hafta-grn-50)] text-[var(--hafta-grn-700)]'
                          : 'border-stone-200 bg-white text-stone-600'
                      }`}
                    >
                      {record.status === 'FINALIZED' ? 'Final' : 'Draft'}
                    </span>
                    {record.amendedFromId ? (
                      <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800">
                        Amandemen R{record.revisionNumber ?? 2}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs tabular-nums text-stone-500">
                    Nyeri {record.painScore}/10 · ROM {record.rangeOfMotionScore}/10 · Kekuatan{' '}
                    {record.strengthScore}/10 · Fungsi {record.functionScore}/10
                  </p>
                  {record.diagnosis ? (
                    <p className="mt-1 truncate text-xs text-stone-500">{record.diagnosis}</p>
                  ) : null}
                  <p className="mt-1 flex items-center gap-1.5 text-[11px] text-stone-400">
                    <CalendarDays className="h-3 w-3" />
                    {formatDate(record.recordedAt)}
                    {record.therapistName ? ` · ${record.therapistName}` : ''}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {history.length === 0 ? (
        <section className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-stone-200 bg-white p-3.5 text-center sm:p-5">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--hafta-org-50)] text-[#181700]">
            <ClipboardList className="h-6 w-6" />
          </span>
          <h2 className="mt-3 text-sm font-bold text-[#181700]">Belum ada episode keluhan</h2>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-stone-500">
            Episode keluhan yang pernah Anda laporkan beserta status peninjauannya akan tampil di
            sini.
          </p>
        </section>
      ) : (
        <section className="rounded-3xl border border-stone-200 bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 border-b border-stone-200 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--hafta-org-50)] text-[#181700]">
                <FileText className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-[#181700]">Riwayat Episode Keluhan</h2>
                <p className="text-xs text-stone-500">Satu entri untuk setiap episode keluhan.</p>
              </div>
            </div>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-semibold text-stone-600">
              {history.length} episode
            </span>
          </div>

          <div className="divide-y divide-stone-100">
            {history.map((item) => {
              const status = STATUS_META[item.status] ?? STATUS_META.SUBMITTED;
              const date = item.submittedAt ?? item.updatedAt;

              return (
                <article key={item.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                  <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-full bg-[var(--hafta-org-50)] text-[#181700]">
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
