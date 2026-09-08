'use client';

import { useMemo, useState } from 'react';
import {
  Activity,
  CalendarCheck,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileText,
  HeartPulse,
  Phone,
  Stethoscope,
  Target,
  TrendingUp,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { MedicalRecordActions } from '@/components/dashboard/medical-record-actions';
import type { PatientMedicalRecordSummary, TherapyProgressView } from '@/server/queries/therapy-progress';

function calculateAge(dateOfBirth: Date | null) {
  if (!dateOfBirth) return null;
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const month = today.getMonth() - dateOfBirth.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < dateOfBirth.getDate())) age -= 1;
  return age;
}

function scoreWidth(score: number) {
  return `${Math.max(0, Math.min(10, score)) * 10}%`;
}

type TabKey = 'medis' | 'riwayat' | 'diagnosis' | 'tindakan' | 'dokumen';

const medicalRecordTabs: { key: TabKey; label: string; shortLabel: string; icon: LucideIcon }[] = [
  { key: 'medis', label: 'Rekam Medis', shortLabel: 'Medis', icon: Activity },
  { key: 'riwayat', label: 'Riwayat Kunjungan', shortLabel: 'Riwayat', icon: CalendarDays },
  { key: 'diagnosis', label: 'Diagnosis', shortLabel: 'Diagnosis', icon: Stethoscope },
  { key: 'tindakan', label: 'Tindakan', shortLabel: 'Tindakan', icon: ClipboardList },
  { key: 'dokumen', label: 'Dokumen & Cetak', shortLabel: 'Dokumen', icon: FileText },
];

/* ──────────────────────────────────────────────────────────────
   MOBILE SUB-COMPONENTS
   ──────────────────────────────────────────────────────────── */

function MobileProfileCard({ patient }: { patient: PatientMedicalRecordSummary | null }) {
  const age = calculateAge(patient?.dateOfBirth ?? null);

  return (
    <section className="rounded-2xl border border-[#E5E0D8] bg-white p-6 shadow-sm">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-2xl border-[2.5px] border-white bg-[#FFF7ED] ring-1 ring-black/[0.04] shadow-sm">
          {patient?.avatarKey ? (
            <img src={patient.avatarKey} alt="Foto profil" className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-[var(--hafta-ylw-400)]">
              {patient?.fullName?.[0]?.toUpperCase() ?? 'P'}
            </span>
          )}
        </div>
        <h2 className="mt-3 text-lg font-bold text-gray-900">{patient?.fullName ?? 'Pasien'}</h2>
        <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          {patient?.caseStatus ? `Kasus: ${patient.caseStatus}` : 'Pasien Aktif'}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400">No. RM</span>
          <strong className="mt-1 block truncate text-[13px] font-bold text-gray-900">
            {patient?.medicalRecordNumber ?? (patient?.id ? patient.id.slice(0, 10).toUpperCase() : '-')}
          </strong>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400">Jenis Kelamin</span>
          <strong className="mt-1 block text-[13px] font-bold text-gray-900">
            {patient?.gender === 'MALE' ? 'Laki-laki' : patient?.gender === 'FEMALE' ? 'Perempuan' : 'Lainnya'}
          </strong>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400">Usia</span>
          <strong className="mt-1 block text-[13px] font-bold text-gray-900">
            {age !== null ? `${age} Tahun` : '-'}
          </strong>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400">Kontak</span>
          <strong
            className="mt-1 block truncate text-[13px] font-bold text-gray-900"
            title={patient?.email ?? patient?.phone ?? '-'}
          >
            {patient?.email || patient?.phone || '-'}
          </strong>
        </div>
      </div>
    </section>
  );
}

function MobileKpiCard({
  icon: Icon,
  label,
  value,
  subtitle,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  subtitle?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3.5 rounded-2xl border border-[#E5E0D8] bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md active:scale-[0.99]"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-gray-400">{label}</p>
        <p className="mt-0.5 truncate text-[15px] font-bold text-gray-900">{value}</p>
        {subtitle && <p className="mt-0.5 truncate text-[11px] text-gray-400">{subtitle}</p>}
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
    </button>
  );
}

function MobileVisitCard({
  record,
  onPrint,
  onDownload,
}: {
  record: TherapyProgressView;
  onPrint: () => void;
  onDownload: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[#E5E0D8] bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-amber-50 text-center ring-1 ring-amber-100">
          <strong className="text-base font-extrabold leading-none text-gray-900">
            {record.recordedAt.getDate()}
          </strong>
          <span className="mt-0.5 text-[9px] font-bold uppercase text-amber-600">
            {record.recordedAt.toLocaleDateString('id-ID', { month: 'short' })}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-gray-900">Kunjungan Terapi Fisio</p>
          <p className="text-[11px] text-gray-400">
            {record.therapistName ?? '-'} &bull;{' '}
            {record.recordedAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <MedicalRecordActions record={record} />
      </div>
    </div>
  );
}

function MobileEmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 px-6 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
        <Icon className="h-6 w-6 text-amber-500" />
      </div>
      <h3 className="mt-3 text-[13px] font-bold text-gray-900">{title}</h3>
      <p className="mt-1 text-[11px] leading-relaxed text-gray-400">{description}</p>
    </div>
  );
}

function MobileTimelineItem({
  record,
  isSelected,
  onSelect,
}: {
  record: TherapyProgressView;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-all active:scale-[0.98] ${
        isSelected
          ? 'border-amber-300 bg-amber-50/60 ring-1 ring-amber-300'
          : 'border-[#E5E0D8] bg-white hover:border-amber-200'
      }`}
    >
      <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-amber-50 text-center ring-1 ring-amber-100">
        <strong className="text-sm font-extrabold leading-none text-gray-900">
          {record.recordedAt.getDate()}
        </strong>
        <span className="mt-0.5 text-[8px] font-bold uppercase text-amber-600">
          {record.recordedAt.toLocaleDateString('id-ID', { month: 'short' })}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-bold text-gray-900">Kunjungan Terapi</p>
        <p className="text-[11px] text-gray-400">
          {record.therapistName ?? '-'} &bull;{' '}
          {record.recordedAt.toLocaleDateString('id-ID', { year: 'numeric' })}
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
        Selesai
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
    </button>
  );
}

function MobileListItem({
  icon: Icon,
  title,
  subtitle,
  badge,
  trailing,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  badge?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-[#E5E0D8] bg-white p-4 shadow-sm">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-bold text-gray-900">{title}</p>
        {subtitle && <p className="mt-0.5 text-[11px] text-gray-400 line-clamp-2">{subtitle}</p>}
        {badge && (
          <span className="mt-1.5 inline-block rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700">
            {badge}
          </span>
        )}
      </div>
      {trailing ?? <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   MAIN COMPONENT
   ──────────────────────────────────────────────────────────── */

export function PatientMedicalRecordView({
  patient,
  records,
}: {
  patient: PatientMedicalRecordSummary | null;
  records: TherapyProgressView[];
}) {
  const [activeTab, setActiveTab] = useState<TabKey>('medis');
  const [selectedRecordId, setSelectedRecordId] = useState(records[0]?.id ?? '');
  const [showAllVisits, setShowAllVisits] = useState<boolean>(false);

  const latestRecord = records[0] ?? null;
  const firstRecord = records[records.length - 1] ?? null;

  const selectedRecord = useMemo(
    () => records.find((record) => record.id === selectedRecordId) ?? latestRecord,
    [latestRecord, records, selectedRecordId],
  );

  const visibleTimelineRecords = showAllVisits ? records : records.slice(0, 4);
  const age = calculateAge(patient?.dateOfBirth ?? null);
  const averageProgress = records.length
    ? Math.round(
        (records.reduce(
          (total, record) => total + record.rangeOfMotionScore + record.strengthScore + record.functionScore,
          0,
        ) /
          (records.length * 30)) *
          100,
      )
    : 0;

  return (
    <div className="space-y-4 pb-28 text-[15px] leading-relaxed text-gray-900 lg:space-y-6 lg:pb-8">
      {/* ═══════════════════════════════════════════════════════
          MOBILE & TABLET LAYOUT (< lg)
         ═══════════════════════════════════════════════════════ */}
      <div className="lg:hidden">
        <MobileProfileCard patient={patient} />

        {/* ── Tab Content (Mobile) ── */}
        <div className="mt-4 space-y-3">
          {/* TAB: Medis */}
          {activeTab === 'medis' && (
            <>
              <MobileKpiCard
                icon={CalendarCheck}
                label="Total Kunjungan"
                value={`${records.length} kali`}
                subtitle={latestRecord ? `Terakhir: ${latestRecord.recordedAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Terakhir: -'}
              />
              <MobileKpiCard
                icon={TrendingUp}
                label="Progres Terapi"
                value={`${averageProgress}%`}
                subtitle="Berdasarkan parameter evaluasi"
              />
              <MobileKpiCard
                icon={Target}
                label="Tujuan Terapi"
                value={patient?.therapyGoal || latestRecord?.diagnosis || 'Belum ditentukan'}
                subtitle={patient?.therapyDiagnosisLabel || latestRecord?.followUpPlan || 'Belum ada rencana tindak lanjut'}
              />
              <MobileKpiCard
                icon={CalendarDays}
                label="Kunjungan Berikutnya"
                value={
                  patient?.nextTherapyAt
                    ? patient.nextTherapyAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'Belum dijadwalkan'
                }
                subtitle={patient?.therapyFrequencyText ? `Frekuensi: ${patient.therapyFrequencyText}` : 'Hubungi klinik untuk jadwal'}
              />

              {records.length === 0 ? (
                <MobileEmptyState
                  icon={Activity}
                  title="Belum ada rekam medis yang dibagikan"
                  description="Evaluasi dan rekam medis akan tampil di sini setelah difinalisasi oleh tim fisioterapis."
                />
              ) : selectedRecord ? (
                <MobileVisitCard
                  record={selectedRecord}
                  onPrint={() => {}}
                  onDownload={() => {}}
                />
              ) : null}
            </>
          )}

          {/* TAB: Riwayat */}
          {activeTab === 'riwayat' && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Riwayat</h2>
                  <p className="text-[11px] text-gray-400">Riwayat kunjungan dan terapi pasien.</p>
                </div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                  {records.length} Kunjungan
                </span>
              </div>

              {records.length === 0 ? (
                <MobileEmptyState
                  icon={CalendarDays}
                  title="Belum ada riwayat kunjungan"
                  description="Riwayat kunjungan akan muncul setelah terapi dimulai."
                />
              ) : (
                <>
                  <div className="flex gap-2">
                    {(['Semua', 'Kunjungan', 'Terapi'] as const).map((f) => (
                      <button
                        key={f}
                        type="button"
                        className={`rounded-full px-4 py-2 text-[12px] font-semibold transition-all ${
                          f === 'Semua'
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'border border-gray-200 bg-white text-gray-500'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2.5">
                    {visibleTimelineRecords.map((record) => (
                      <MobileTimelineItem
                        key={record.id}
                        record={record}
                        isSelected={record.id === selectedRecordId}
                        onSelect={() => {
                          setSelectedRecordId(record.id);
                          setActiveTab('medis');
                        }}
                      />
                    ))}
                  </div>
                  {records.length > 4 && (
                    <button
                      type="button"
                      onClick={() => setShowAllVisits((c: boolean) => !c)}
                      className="flex items-center gap-2 text-[12px] font-bold text-amber-600"
                    >
                      {showAllVisits ? 'Tampilkan lebih sedikit' : `Lihat seluruh ${records.length} kunjungan`}
                      <ChevronDown className={`h-4 w-4 transition-transform ${showAllVisits ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </>
              )}
            </>
          )}

          {/* TAB: Diagnosis */}
          {activeTab === 'diagnosis' && (
            <>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Diagnosis</h2>
                <p className="text-[11px] text-gray-400">Hasil evaluasi dan diagnosis pasien.</p>
              </div>
              {records.length === 0 ? (
                <MobileEmptyState
                  icon={Stethoscope}
                  title="Belum ada diagnosis"
                  description="Data diagnosis akan muncul setelah evaluasi oleh terapis."
                />
              ) : (
                <div className="space-y-2.5">
                  {records.map((record) => (
                    <div key={record.id} className="rounded-2xl border border-[#E5E0D8] bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-sm font-bold text-amber-600 ring-1 ring-amber-100">
                          {record.recordedAt.getDate()}
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-gray-900">Diagnosis Evaluasi</p>
                          <p className="text-[10px] text-gray-400">
                            {record.recordedAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50/50 p-3">
                        <h4 className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Diagnosis Fisioterapi</h4>
                        <p className="mt-1 text-[12px] leading-relaxed text-gray-600">{record.diagnosis || '-'}</p>
                      </div>
                      <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50/50 p-3">
                        <h4 className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Anamnesis</h4>
                        <p className="mt-1 text-[12px] leading-relaxed text-gray-600">{record.anamnesis || '-'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* TAB: Tindakan */}
          {activeTab === 'tindakan' && (
            <>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Tindakan</h2>
                <p className="text-[11px] text-gray-400">Daftar tindakan terapi yang diberikan.</p>
              </div>
              {records.length === 0 ? (
                <MobileEmptyState
                  icon={ClipboardList}
                  title="Belum ada tindakan"
                  description="Daftar tindakan terapi akan muncul setelah evaluasi."
                />
              ) : (
                <div className="space-y-2.5">
                  {records.map((record) => (
                    <MobileListItem
                      key={record.id}
                      icon={ClipboardList}
                      title={`Kunjungan ${record.recordedAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`}
                      subtitle={record.treatment || 'Tindakan terapi'}
                      badge={record.therapistName ?? undefined}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* TAB: Dokumen */}
          {activeTab === 'dokumen' && (
            <>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Dokumen</h2>
                <p className="text-[11px] text-gray-400">Dokumen dan hasil pemeriksaan pasien.</p>
              </div>
              {records.length === 0 ? (
                <MobileEmptyState
                  icon={FileText}
                  title="Belum ada dokumen"
                  description="Dokumen rekam medis akan tersedia setelah evaluasi."
                />
              ) : (
                <div className="space-y-2.5">
                  {records.map((record) => (
                    <div key={record.id} className="flex items-center gap-3.5 rounded-2xl border border-[#E5E0D8] bg-white p-4 shadow-sm">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                        <FileText className="h-[18px] w-[18px]" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold text-gray-900">
                          Rekam Medis &bull; {record.recordedAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-[11px] text-gray-400">PDF &bull; 1 file</p>
                      </div>
                      <MedicalRecordActions record={record} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          DESKTOP LAYOUT (>= lg)
         ═══════════════════════════════════════════════════════ */}
      <div className="hidden lg:block">
        {/* Desktop Profile Card */}
        <section className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white p-7 shadow-sm">
          <div className="flex items-center gap-7">
            <div className="relative shrink-0">
              <div className="flex h-22 w-22 items-center justify-center overflow-hidden rounded-2xl border-2 border-white bg-amber-50 shadow-sm ring-1 ring-black/[0.04] text-2xl font-bold text-amber-600">
                {patient?.avatarKey ? (
                  <img src={patient.avatarKey} alt="Foto profil" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-amber-600">
                    {patient?.fullName?.[0]?.toUpperCase() ?? 'P'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="truncate text-2xl font-bold text-gray-900">{patient?.fullName ?? 'Pasien'}</h2>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  {patient?.caseStatus ? `Kasus: ${patient.caseStatus}` : 'Pasien Aktif'}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2.5">
                <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3">
                  <span className="block text-[11px] font-semibold uppercase tracking-wide text-gray-400">No. Rekam Medis</span>
                  <strong className="mt-1 block truncate text-sm font-bold text-gray-900">
                    {patient?.medicalRecordNumber ?? (patient?.id ? patient.id.slice(0, 10).toUpperCase() : '-')}
                  </strong>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3">
                  <span className="block text-[11px] font-semibold uppercase tracking-wide text-gray-400">Jenis Kelamin</span>
                  <strong className="mt-1 block truncate text-sm font-bold text-gray-900">
                    {patient?.gender === 'MALE' ? 'Laki-laki' : patient?.gender === 'FEMALE' ? 'Perempuan' : 'Lainnya'}
                  </strong>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3">
                  <span className="block text-[11px] font-semibold uppercase tracking-wide text-gray-400">Usia</span>
                  <strong className="mt-1 block truncate text-sm font-bold text-gray-900">
                    {age !== null ? `${age} Tahun` : '-'}
                  </strong>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3">
                  <span className="block text-[11px] font-semibold uppercase tracking-wide text-gray-400">Kontak / Email</span>
                  <strong
                    className="mt-1 block truncate text-sm font-bold text-gray-900"
                    title={patient?.email ?? patient?.phone ?? '-'}
                  >
                    {patient?.email || patient?.phone || '-'}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Desktop Tabs */}
        <div className="mt-6 rounded-2xl border border-[#E5E0D8] bg-white p-1.5 shadow-sm">
          <nav className="flex items-center gap-1.5 overflow-x-auto px-1">
            {medicalRecordTabs.map(({ key, label, icon: Icon }) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-4 text-[13px] font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-50 text-amber-700 border border-amber-200 shadow-xs'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-amber-600' : 'text-gray-400'}`} />
                  {label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Desktop Main + Sidebar */}
        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <main className="space-y-6">
            {records.length === 0 ? (
              <div className="rounded-2xl border border-[#E5E0D8] bg-white p-10 text-center shadow-sm">
                <Activity className="mx-auto h-12 w-12 text-amber-500" />
                <h3 className="mt-4 text-lg font-bold text-gray-900">Belum ada rekam medis yang dibagikan</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Evaluasi dan rekam medis akan tampil di sini setelah difinalisasi oleh tim fisioterapis.
                </p>
              </div>
            ) : activeTab === 'medis' ? (
              <>
                {[selectedRecord]
                  .filter((r): r is TherapyProgressView => Boolean(r))
                  .map((record) => (
                    <article key={record.id} className="rounded-2xl border border-[#E5E0D8] bg-white p-7 shadow-sm">
                      <header className="flex items-center justify-between border-b border-gray-100 pb-5">
                        <div className="flex items-center gap-4">
                          <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-amber-50 ring-1 ring-amber-100 text-center">
                            <strong className="text-xl font-extrabold leading-none text-gray-900">{record.recordedAt.getDate()}</strong>
                            <span className="mt-0.5 text-[10px] font-bold uppercase text-amber-600">
                              {record.recordedAt.toLocaleDateString('id-ID', { month: 'short' })}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">Kunjungan Terapi Fisio</h3>
                            <p className="text-xs text-gray-500">
                              Fisioterapis: <span className="font-semibold text-gray-900">{record.therapistName ?? '-'}</span> &bull;{' '}
                              {record.recordedAt.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <MedicalRecordActions record={record} />
                      </header>

                      <div className="mt-6">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Evaluasi Parameter Fisik</h4>
                        <div className="mt-3 grid grid-cols-4 gap-3">
                          {[
                            { label: 'Nyeri', score: record.painScore, icon: HeartPulse },
                            { label: 'ROM (Gerak)', score: record.rangeOfMotionScore, icon: Activity },
                            { label: 'Kekuatan Otot', score: record.strengthScore, icon: UserRound },
                            { label: 'Fungsi Fisik', score: record.functionScore, icon: Activity },
                          ].map(({ label, score, icon: Icon }) => (
                            <div key={label} className="rounded-xl border border-gray-200 bg-gray-50/50 p-3.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1.5 font-semibold text-gray-900">
                                  <Icon className="h-3.5 w-3.5 text-amber-500" />{label}
                                </span>
                                <strong className="text-xs font-bold text-gray-900">{score}/10</strong>
                              </div>
                              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-gray-200">
                                <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: scoreWidth(Number(score)) }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-6">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Catatan & Tindakan Klinis</h4>
                        <div className="mt-3 grid grid-cols-2 gap-3.5 xl:grid-cols-3">
                          {[
                            ['Anamnesis', record.anamnesis],
                            ['Pemeriksaan Fisik & Penunjang', record.physicalExamination],
                            ['Diagnosis Fisioterapi', record.diagnosis],
                            ['Pengobatan & Tindakan Diberikan', record.treatment],
                            ['Rencana Tindak Lanjut & Edukasi', record.followUpPlan],
                            ['Ringkasan & Catatan Tambahan', record.summary],
                          ].map(([label, content]) => (
                            <section key={label} className="min-h-28 rounded-xl border border-gray-200 bg-gray-50/50 p-4">
                              <h5 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</h5>
                              <p className="mt-2 text-[13px] leading-relaxed text-gray-600">{content || '-'}</p>
                            </section>
                          ))}
                        </div>
                      </div>
                    </article>
                  ))}
                {records.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('riwayat')}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-100"
                  >
                    <CalendarDays className="h-4 w-4 text-amber-500" />
                    Lihat riwayat lengkap ({records.length} kunjungan tercatat)
                  </button>
                )}
              </>
            ) : activeTab === 'riwayat' ? (
              <div className="rounded-2xl border border-[#E5E0D8] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Riwayat Seluruh Kunjungan</h3>
                    <p className="text-xs text-gray-500">Klik salah satu kunjungan untuk melihat detail rekam medis lengkap.</p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                    {records.length} Kunjungan
                  </span>
                </div>
                <div className="mt-5 space-y-3">
                  {visibleTimelineRecords.map((record) => {
                    const isSel = record.id === selectedRecordId;
                    return (
                      <button
                        key={record.id}
                        type="button"
                        onClick={() => { setSelectedRecordId(record.id); setActiveTab('medis'); }}
                        className={`flex w-full cursor-pointer items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                          isSel ? 'border-amber-300 bg-amber-50/60 ring-1 ring-amber-300' : 'border-gray-200 bg-white hover:border-amber-200'
                        }`}
                      >
                        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-amber-50 ring-1 ring-amber-100 text-center">
                          <strong className="text-base font-extrabold leading-none text-gray-900">{record.recordedAt.getDate()}</strong>
                          <span className="text-[9px] font-bold uppercase text-amber-600">
                            {record.recordedAt.toLocaleDateString('id-ID', { month: 'short' })}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-gray-900">Kunjungan Terapi</p>
                          <p className="text-xs text-gray-500">Terapis: {record.therapistName ?? '-'}</p>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center">
                          {[
                            ['Nyeri', record.painScore],
                            ['ROM', record.rangeOfMotionScore],
                            ['Kekuatan', record.strengthScore],
                            ['Fungsi', record.functionScore],
                          ].map(([l, s]) => (
                            <div key={l} className="rounded-lg bg-gray-50 px-2 py-1 border border-gray-200">
                              <span className="block text-[10px] text-gray-400">{l}</span>
                              <strong className="text-xs font-bold text-gray-900">{s}/10</strong>
                            </div>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {records.length > 4 && (
                  <button type="button" onClick={() => setShowAllVisits((c: boolean) => !c)} className="mt-5 flex items-center gap-2 text-xs font-bold text-amber-600">
                    {showAllVisits ? 'Tampilkan lebih sedikit' : `Lihat seluruh ${records.length} kunjungan`}
                    <ChevronDown className={`h-4 w-4 transition-transform ${showAllVisits ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
            ) : activeTab === 'diagnosis' ? (
              <div className="space-y-4">
                {records.map((r) => (
                  <article key={r.id} className="rounded-2xl border border-[#E5E0D8] bg-white p-6 shadow-sm">
                    <header className="flex items-center gap-3 border-b border-gray-100 pb-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-sm font-bold text-amber-600 ring-1 ring-amber-100">{r.recordedAt.getDate()}</div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">Diagnosis Evaluasi</p>
                        <p className="text-[11px] text-gray-500">{r.recordedAt.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                    </header>
                    <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50/50 p-4">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Diagnosis Fisioterapi</h4>
                      <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{r.diagnosis || '-'}</p>
                    </div>
                    <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50/50 p-4">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Anamnesis</h4>
                      <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{r.anamnesis || '-'}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : activeTab === 'tindakan' ? (
              <div className="space-y-4">
                {records.map((r) => (
                  <article key={r.id} className="rounded-2xl border border-[#E5E0D8] bg-white p-6 shadow-sm">
                    <header className="flex items-center gap-3 border-b border-gray-100 pb-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-sm font-bold text-amber-600 ring-1 ring-amber-100">{r.recordedAt.getDate()}</div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">Tindakan Terapi</p>
                        <p className="text-[11px] text-gray-500">{r.recordedAt.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                    </header>
                    <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50/50 p-4">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Pemeriksaan Fisik & Penunjang</h4>
                      <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{r.physicalExamination || '-'}</p>
                    </div>
                    <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50/50 p-4">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Pengobatan & Tindakan Diberikan</h4>
                      <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{r.treatment || '-'}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {records.map((r) => (
                  <article key={r.id} className="rounded-2xl border border-[#E5E0D8] bg-white p-6 shadow-sm">
                    <header className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">Dokumen Rekam Medis (Kunjungan {r.recordedAt.toLocaleDateString('id-ID')})</p>
                          <p className="text-xs text-gray-500">Terapis: {r.therapistName ?? '-'} &bull; Format PDF Resmi</p>
                        </div>
                      </div>
                      <MedicalRecordActions record={r} />
                    </header>
                  </article>
                ))}
              </div>
            )}
          </main>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-[#E5E0D8] bg-white p-6 shadow-sm">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400"><HeartPulse className="h-4 w-4 text-amber-500" /> Ringkasan & Diagnosis</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-2.5">
                  <dt className="text-gray-500">Status</dt>
                  <dd className="rounded-full bg-amber-50 px-3 py-1 font-bold text-amber-700 ring-1 ring-inset ring-amber-200">{patient?.caseStatus ?? 'Aktif'}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-2.5">
                  <dt className="text-gray-500">Kunjungan</dt>
                  <dd className="font-bold text-gray-900">{records.length} / {records.length + (patient?.nextTherapyAt ? 1 : 0)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-2.5">
                  <dt className="text-gray-500">Dimulai</dt>
                  <dd className="font-bold text-gray-900">{firstRecord ? firstRecord.recordedAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-2.5">
                  <dt className="text-gray-500">Berikutnya</dt>
                  <dd className="font-bold text-amber-600">{patient?.nextTherapyAt ? patient.nextTherapyAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Belum dijadwalkan'}</dd>
                </div>
              </dl>
              <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50/50 p-3.5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Diagnosis</h4>
                <p className="mt-1.5 text-sm font-bold text-gray-900">{latestRecord?.diagnosis ?? patient?.therapyDiagnosisLabel ?? 'Belum tersedia'}</p>
              </div>
              <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50/50 p-3.5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Tujuan Terapi</h4>
                <p className="mt-1.5 text-xs leading-relaxed text-gray-500">{patient?.therapyGoal ?? latestRecord?.followUpPlan ?? '-'}</p>
              </div>
            </section>
            <section className="rounded-2xl border border-[#E5E0D8] bg-white p-6 shadow-sm">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400"><UserRound className="h-4 w-4 text-amber-500" /> Tim & Catatan</h3>
              <div className="mt-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Fisioterapis</p>
                <p className="mt-1.5 text-sm font-bold text-gray-900">{patient?.therapistName ?? latestRecord?.therapistName ?? 'Terapis Hafta'}</p>
              </div>
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Catatan Penting</h4>
                <p className="mt-1.5 text-[13px] leading-relaxed text-gray-600">{patient?.therapistNote ?? latestRecord?.followUpPlan ?? 'Belum ada catatan.'}</p>
                {patient?.therapistNote && (
                  <p className="mt-2 text-[11px] text-gray-400">
                    Oleh {patient.therapistNoteAuthor ?? patient.therapistName ?? 'Terapis'}
                    {patient.therapistNoteAt ? ` \u2022 ${patient.therapistNoteAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                  </p>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          MOBILE BOTTOM NAV
         ═══════════════════════════════════════════════════════ */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white px-1 pt-1 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] lg:hidden">
        <div className="grid grid-cols-5 gap-0.5">
          {medicalRecordTabs.map(({ key, shortLabel, icon: Icon }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`flex min-h-[52px] cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-center transition-all ${
                  isActive ? 'bg-amber-50 text-amber-700' : 'text-gray-400 active:text-amber-600'
                }`}
              >
                <Icon className={`h-[18px] w-[18px] ${isActive ? 'text-amber-600' : ''}`} />
                <span className={`text-[10px] leading-tight ${isActive ? 'font-bold' : 'font-medium'}`}>{shortLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
