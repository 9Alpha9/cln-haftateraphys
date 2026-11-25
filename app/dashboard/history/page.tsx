import { Activity, CalendarDays, ClipboardList, FileText } from 'lucide-react';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { IntakeHistoryActions } from '@/components/dashboard/intake-history-actions';
import { requireSession } from '@/lib/auth/require-session';
import { PERMISSIONS, requirePermission } from '@/lib/permissions';
import { getPatientVisibleIntakeHistory } from '@/server/queries/patient-intakes';
import { getScopedTherapyProgress } from '@/server/queries/therapy-progress';
import { TherapyHistoryPage } from '@/components/patient/therapy-history-page';

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
    <TherapyHistoryPage
      initialRecords={therapyHistory}
      initialSearch=""
    />
  );
}
