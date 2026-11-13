'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Dumbbell,
  FileText,
  HeartPulse,
  Stethoscope,
  Target,
  TrendingUp,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { MedicalRecordActions } from '@/components/dashboard/medical-record-actions';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { cn } from '@/lib/utils';
import type { PatientMedicalRecordSummary, TherapyProgressView } from '@/server/queries/therapy-progress';
import type { HomeProgramView } from '@/server/queries/home-programs';
import type { TreatmentPlanView } from '@/server/queries/treatment-plans';

type TabKey = 'medis' | 'riwayat' | 'diagnosis' | 'tindakan' | 'dokumen';

const TABS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: 'medis', label: 'Rekam Medis', icon: Activity },
  { key: 'riwayat', label: 'Kunjungan', icon: CalendarDays },
  { key: 'diagnosis', label: 'Diagnosis', icon: Stethoscope },
  { key: 'tindakan', label: 'Tindakan', icon: ClipboardList },
  { key: 'dokumen', label: 'Dokumen', icon: FileText },
];

const CLINICAL_SECTIONS: { label: string; field: keyof TherapyProgressView }[] = [
  { label: 'Anamnesis', field: 'anamnesis' },
  { label: 'Pemeriksaan fisik & penunjang', field: 'physicalExamination' },
  { label: 'Diagnosis fisioterapi', field: 'diagnosis' },
  { label: 'Tindakan yang diberikan', field: 'treatment' },
  { label: 'Rencana tindak lanjut & edukasi', field: 'followUpPlan' },
  { label: 'Ringkasan sesi', field: 'summary' },
];

function calculateAge(dateOfBirth: Date | null) {
  if (!dateOfBirth) return null;
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const month = today.getMonth() - dateOfBirth.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < dateOfBirth.getDate())) age -= 1;
  return age;
}

function formatDate(value: Date) {
  return value.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatShortDate(value: Date) {
  return value.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatMonth(value: Date) {
  return value.toLocaleDateString('id-ID', { month: 'short' });
}

type MetricTone = 'optimal' | 'good' | 'attention';

function getMetricPresentation(key: string, score: number): {
  percentage: number;
  label: string;
  tone: MetricTone;
} {
  const clamped = Math.max(0, Math.min(10, Number(score)));
  if (key === 'pain') {
    if (clamped <= 3) return { percentage: (10 - clamped) * 10, label: 'Ringan', tone: 'optimal' };
    if (clamped <= 6) return { percentage: (10 - clamped) * 10, label: 'Sedang', tone: 'good' };
    return { percentage: (10 - clamped) * 10, label: 'Perlu perhatian', tone: 'attention' };
  }
  if (clamped >= 8) return { percentage: clamped * 10, label: 'Optimal', tone: 'optimal' };
  if (clamped >= 6) return { percentage: clamped * 10, label: 'Baik', tone: 'good' };
  return { percentage: clamped * 10, label: 'Perlu perhatian', tone: 'attention' };
}

const TONE_STYLES: Record<MetricTone, { badge: string; bar: string; dot: string }> = {
  optimal: {
    badge: 'bg-[var(--hafta-grn-50)] text-[var(--hafta-grn-700)]',
    bar: 'bg-[var(--hafta-grn-500)]',
    dot: 'bg-[var(--hafta-grn-500)]',
  },
  good: {
    badge: 'bg-[var(--hafta-100)] text-[var(--hafta-800)]',
    bar: 'bg-[var(--hafta-300)]',
    dot: 'bg-[var(--hafta-300)]',
  },
  attention: {
    badge: 'bg-[var(--hafta-red-50)] text-[var(--hafta-red-700)]',
    bar: 'bg-[var(--hafta-red-500)]',
    dot: 'bg-[var(--hafta-red-500)]',
  },
};

function DateBadge({ date }: { date: Date }) {
  return (
    <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl border border-border bg-secondary/60 text-foreground">
      <span className="text-[13px] font-extrabold leading-none">{date.getDate()}</span>
      <span className="mt-0.5 text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
        {formatMonth(date)}
      </span>
    </span>
  );
}

function SectionCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-2xl border border-border bg-card', className)}>
      {title ? (
        <header className="flex items-start justify-between gap-2 border-b border-border px-3 py-2.5 sm:px-4">
          <div className="min-w-0">
            <h2 className="truncate text-[13px] font-bold text-foreground sm:text-sm">{title}</h2>
            {description ? (
              <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-muted-foreground sm:text-[11px]">
                {description}
              </p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      <div className="p-3 sm:p-4">{children}</div>
    </section>
  );
}

function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-[10px] font-semibold text-foreground',
        className,
      )}
    >
      {children}
    </span>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center px-4 py-8 text-center sm:py-12">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--hafta-100)] text-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-3 text-sm font-bold text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
        {description}
      </p>
    </div>
  );
}

export function PatientMedicalRecordView({
  patient,
  records,
  homeProgram = null,
  treatmentPlan = null,
}: {
  patient: PatientMedicalRecordSummary | null;
  records: TherapyProgressView[];
  homeProgram?: HomeProgramView | null;
  treatmentPlan?: TreatmentPlanView | null;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>('medis');
  const [selectedRecordId, setSelectedRecordId] = useState(records[0]?.id ?? '');
  const [visitPage, setVisitPage] = useState(1);
  const [visitsPerPage, setVisitsPerPage] = useState(3);

  const latestRecord = records[0] ?? null;
  const selectedRecord = useMemo(
    () => records.find((record) => record.id === selectedRecordId) ?? latestRecord,
    [latestRecord, records, selectedRecordId],
  );
  const firstRecord = records[records.length - 1] ?? null;
  const visitPageCount = Math.max(1, Math.ceil(records.length / visitsPerPage));
  const safeVisitPage = Math.min(visitPage, visitPageCount);
  const visibleVisits = records.slice(
    (safeVisitPage - 1) * visitsPerPage,
    safeVisitPage * visitsPerPage,
  );
  const chronologicalRecords = useMemo(
    () =>
      [...records].sort(
        (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
      ),
    [records],
  );
  const visitNumberById = useMemo(
    () => new Map(chronologicalRecords.map((record, index) => [record.id, index + 1])),
    [chronologicalRecords],
  );
  const recentDiagnoses = useMemo(
    () =>
      records
        .filter((record) => Boolean(record.diagnosis))
        .slice(0, 3),
    [records],
  );
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

  function openRecord(recordId: string) {
    setSelectedRecordId(recordId);
    setActiveTab('medis');
  }

  const quickTiles: { key: TabKey | 'latihan'; label: string; hint: string; icon: LucideIcon }[] = [
    { key: 'medis', label: 'Rekam Medis', hint: `${records.length} catatan`, icon: FileText },
    { key: 'riwayat', label: 'Kunjungan', hint: 'Riwayat sesi', icon: CalendarDays },
    { key: 'dokumen', label: 'Dokumen', hint: 'Cetak & unduh', icon: ClipboardList },
    { key: 'latihan', label: 'Latihan Saya', hint: 'Program rumah', icon: Dumbbell },
  ];

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* ── 1. PROFIL RINGKAS ── */}
      <section className="rounded-2xl border border-border bg-card p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--hafta-100)] text-base font-bold text-foreground sm:h-14 sm:w-14 sm:text-lg">
            {patient?.avatarKey ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={patient.avatarKey} alt="Foto profil" className="h-full w-full object-cover" />
            ) : (
              patient?.fullName?.[0]?.toUpperCase() ?? 'P'
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h1 className="truncate text-[15px] font-extrabold leading-tight text-foreground sm:text-lg">
                  {patient?.fullName ?? 'Pasien'}
                </h1>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                  No. RM {patient?.medicalRecordNumber ?? patient?.id?.slice(0, 10).toUpperCase() ?? '-'}
                </p>
              </div>
              {selectedRecord ? (
                <div className="shrink-0">
                  <MedicalRecordActions record={selectedRecord} />
                </div>
              ) : null}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Chip className="border-[var(--hafta-200)] bg-[var(--hafta-100)] normal-case">
                {patient?.caseStatus ? `Kasus: ${patient.caseStatus}` : 'Pasien aktif'}
              </Chip>
              {age !== null ? <Chip>{age} tahun</Chip> : null}
              {patient?.gender ? <Chip>{patient.gender}</Chip> : null}
              {patient?.therapyFrequencyText ? (
                <Chip className="hidden sm:inline-flex">{patient.therapyFrequencyText}</Chip>
              ) : null}
            </div>
          </div>
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2">
          {[
            { label: 'Total sesi', value: `${records.length}` },
            { label: 'Terapis', value: patient?.therapistName ?? latestRecord?.therapistName ?? '-' },
            {
              label: 'Mulai terapi',
              value: firstRecord ? formatShortDate(firstRecord.recordedAt) : '-',
            },
            {
              label: 'Jadwal berikutnya',
              value: patient?.nextTherapyAt ? formatShortDate(patient.nextTherapyAt) : '-',
            },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-secondary/50 px-2.5 py-2">
              <dt className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                {item.label}
              </dt>
              <dd className="mt-0.5 truncate text-[11px] font-bold text-foreground sm:text-xs">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── 2. QUICK TILES ── */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {quickTiles.map(({ key, label, hint, icon: Icon }) => {
          const isActive = key !== 'latihan' && activeTab === key;
          const content = (
            <>
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg',
                  isActive
                    ? 'bg-[var(--hafta-300)] text-[var(--hafta-950)]'
                    : 'bg-secondary text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="mt-2 block truncate text-[11px] font-bold text-foreground sm:text-xs">
                {label}
              </span>
              <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">{hint}</span>
            </>
          );
          const cls = cn(
            'group flex min-h-[86px] w-full flex-col items-start rounded-2xl border p-2.5 text-left transition-colors sm:p-3',
            isActive
              ? 'border-[var(--hafta-300)] bg-[var(--hafta-50)]'
              : 'border-border bg-card hover:border-[var(--hafta-200)] hover:bg-secondary/40',
          );
          return key === 'latihan' ? (
            <Link key={key} href="/dashboard/exercises" className={cls}>
              {content}
            </Link>
          ) : (
            <button key={key} type="button" onClick={() => setActiveTab(key)} className={cls}>
              {content}
            </button>
          );
        })}
      </div>

      {/* ── 3. TAB SEGMENTED ── */}
      <nav
        aria-label="Bagian rekam medis"
        className="flex gap-1 overflow-x-auto rounded-full border border-border bg-card p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            aria-pressed={activeTab === key}
            className={cn(
              'inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold transition-colors',
              activeTab === key
                ? 'bg-[var(--hafta-300)] text-[var(--hafta-950)]'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </nav>

      <div className="grid gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-3 sm:space-y-4">
          {records.length === 0 ? (
            <SectionCard>
              <EmptyState
                icon={Activity}
                title="Belum ada rekam medis"
                description="Catatan evaluasi akan tampil setelah fisioterapis menyelesaikan sesi dan membagikannya untuk Anda."
              />
            </SectionCard>
          ) : activeTab === 'medis' && selectedRecord ? (
            <>
              <SectionCard
                title="Evaluasi Sesi Terapi"
                description={`${formatDate(selectedRecord.recordedAt)} · ${
                  selectedRecord.therapistName ?? 'Fisioterapis Hafta'
                }`}
                action={
                  <span className="rounded-full bg-[var(--hafta-100)] px-2 py-0.5 text-[9px] font-bold text-[var(--hafta-800)]">
                    Sesi ke-{visitNumberById.get(selectedRecord.id) ?? 1}
                  </span>
                }
              >
                <dl className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2">
                  {[
                    { key: 'pain', label: 'Nyeri', score: selectedRecord.painScore, icon: HeartPulse },
                    {
                      key: 'rom',
                      label: 'ROM',
                      score: selectedRecord.rangeOfMotionScore,
                      icon: Activity,
                    },
                    {
                      key: 'strength',
                      label: 'Kekuatan',
                      score: selectedRecord.strengthScore,
                      icon: TrendingUp,
                    },
                    {
                      key: 'function',
                      label: 'Fungsi',
                      score: selectedRecord.functionScore,
                      icon: UserRound,
                    },
                  ].map(({ key, label, score, icon: Icon }) => {
                    const presentation = getMetricPresentation(key, Number(score));
                    const tone = TONE_STYLES[presentation.tone];
                    return (
                      <div key={key} className="rounded-xl border border-border bg-secondary/30 p-2.5">
                        <div className="flex items-center justify-between gap-1">
                          <dt className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                            <Icon className="h-3 w-3" />
                            {label}
                          </dt>
                          <span className={cn('rounded-full px-1.5 py-0.5 text-[8px] font-bold leading-none', tone.badge)}>
                            {presentation.label}
                          </span>
                        </div>
                        <dd className="mt-1.5 flex items-baseline gap-0.5 text-foreground">
                          <span className="font-mono text-xl font-extrabold leading-none">{score}</span>
                          <span className="text-[10px] text-muted-foreground">/10</span>
                        </dd>
                        <div className="mt-2 h-1 overflow-hidden rounded-full bg-border">
                          <div
                            className={cn('h-full rounded-full', tone.bar)}
                            style={{ width: `${presentation.percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </dl>

                <dl className="mt-3 divide-y divide-border">
                  {CLINICAL_SECTIONS.map(({ label, field }) => {
                    const value = selectedRecord[field];
                    return (
                      <div key={field} className="grid gap-0.5 py-2.5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-3">
                        <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {label}
                        </dt>
                        <dd className="whitespace-pre-wrap text-xs leading-relaxed text-foreground sm:text-[13px]">
                          {typeof value === 'string' && value ? (
                            value
                          ) : (
                            <span className="text-muted-foreground">Tidak dicatat</span>
                          )}
                        </dd>
                      </div>
                    );
                  })}
                </dl>

                {records.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab('riwayat')}
                    className="mt-2 inline-flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full border border-border bg-card text-[11px] font-semibold text-foreground transition-colors hover:bg-secondary"
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                    Lihat semua kunjungan ({records.length})
                  </button>
                ) : null}
              </SectionCard>
            </>
          ) : activeTab === 'riwayat' ? (
            <SectionCard
              title="Riwayat Kunjungan"
              description="Pilih kunjungan untuk membuka detail rekam medis."
              action={
                <span className="rounded-full bg-[var(--hafta-100)] px-2 py-0.5 text-[9px] font-bold text-[var(--hafta-800)]">
                  {records.length} sesi
                </span>
              }
            >
              <div className="divide-y divide-border -my-1">
                {visibleVisits.map((record) => (
                  <button
                    key={record.id}
                    type="button"
                    onClick={() => openRecord(record.id)}
                    className="group flex w-full cursor-pointer items-center gap-2.5 py-2.5 text-left"
                  >
                    <DateBadge date={record.recordedAt} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-bold text-foreground">
                        Kunjungan ke-{visitNumberById.get(record.id) ?? 0}
                      </span>
                      <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
                        {record.therapistName ?? 'Fisioterapis Hafta'} · {formatShortDate(record.recordedAt)}
                      </span>
                      <span className="mt-1 flex flex-wrap gap-x-2.5 gap-y-0.5 text-[10px] text-muted-foreground">
                        <span>Nyeri {record.painScore}/10</span>
                        <span>Fungsi {record.functionScore}/10</span>
                        <span
                          className={cn(
                            'rounded-full px-1.5 py-px text-[9px] font-bold',
                            record.status === 'FINALIZED'
                              ? 'bg-[var(--hafta-grn-50)] text-[var(--hafta-grn-700)]'
                              : 'bg-[var(--hafta-100)] text-[var(--hafta-800)]',
                          )}
                        >
                          {record.status === 'FINALIZED' ? 'Final' : 'Draft'}
                        </span>
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
              <PaginationBar
                page={safeVisitPage}
                pageCount={visitPageCount}
                pageSize={visitsPerPage}
                pageSizeOptions={[3, 5, 10]}
                onPageChange={setVisitPage}
                onPageSizeChange={(size) => {
                  setVisitsPerPage(size);
                  setVisitPage(1);
                }}
              />
            </SectionCard>
          ) : activeTab === 'diagnosis' ? (
            <SectionCard title="Diagnosis & Anamnesis" description="Ringkasan diagnosis dari setiap evaluasi.">
              <div className="divide-y divide-border -my-1">
                {records.map((record) => (
                  <article key={record.id} className="py-2.5">
                    <div className="flex items-center gap-2.5">
                      <DateBadge date={record.recordedAt} />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-foreground">
                          Kunjungan ke-{visitNumberById.get(record.id) ?? 0}
                        </p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          {record.therapistName ?? 'Fisioterapis Hafta'}
                        </p>
                      </div>
                    </div>
                    <dl className="mt-2 space-y-2">
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Diagnosis
                        </dt>
                        <dd className="mt-0.5 text-xs leading-relaxed text-foreground">
                          {record.diagnosis || 'Tidak dicatat'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Anamnesis
                        </dt>
                        <dd className="mt-0.5 text-xs leading-relaxed text-foreground">
                          {record.anamnesis || 'Tidak dicatat'}
                        </dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            </SectionCard>
          ) : activeTab === 'tindakan' ? (
            <SectionCard title="Tindakan Terapi" description="Pemeriksaan dan tindakan pada setiap sesi.">
              <div className="divide-y divide-border -my-1">
                {records.map((record) => (
                  <article key={record.id} className="py-2.5">
                    <div className="flex items-center gap-2.5">
                      <DateBadge date={record.recordedAt} />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-foreground">
                          Kunjungan ke-{visitNumberById.get(record.id) ?? 0}
                        </p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          {record.therapistName ?? 'Fisioterapis Hafta'}
                        </p>
                      </div>
                    </div>
                    <dl className="mt-2 space-y-2">
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Pemeriksaan fisik &amp; penunjang
                        </dt>
                        <dd className="mt-0.5 text-xs leading-relaxed text-foreground">
                          {record.physicalExamination || 'Tidak dicatat'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Tindakan
                        </dt>
                        <dd className="mt-0.5 text-xs leading-relaxed text-foreground">
                          {record.treatment || 'Tidak dicatat'}
                        </dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            </SectionCard>
          ) : (
            <SectionCard title="Dokumen & Cetak" description="Unduh atau cetak ringkasan rekam medis.">
              <div className="divide-y divide-border -my-1">
                {records.map((record) => (
                  <div key={record.id} className="flex items-center gap-2.5 py-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-foreground">
                        Rekam Medis Kunjungan ke-{visitNumberById.get(record.id) ?? 0}
                      </p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {record.therapistName ?? 'Fisioterapis Hafta'} · {formatShortDate(record.recordedAt)}
                      </p>
                    </div>
                    <MedicalRecordActions record={record} />
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* ── RENCANA TERAPI + LATIHAN (compact) ── */}
          {treatmentPlan ? (
            <SectionCard
              title="Rencana Terapi"
              description="Tujuan dan intervensi dari fisioterapis Anda"
              action={
                <span className="rounded-full bg-[var(--hafta-grn-50)] px-2 py-0.5 text-[9px] font-bold text-[var(--hafta-grn-700)]">
                  Aktif
                </span>
              }
            >
              <dl className="space-y-2 text-xs">
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Tujuan</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap leading-relaxed text-foreground">{treatmentPlan.goals}</dd>
                </div>
                <div className="border-t border-border pt-2">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Intervensi</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap leading-relaxed text-foreground">
                    {treatmentPlan.interventions}
                  </dd>
                </div>
                {treatmentPlan.reviewIntervalText || treatmentPlan.reviewAt ? (
                  <p className="border-t border-border pt-2 text-[10px] text-muted-foreground">
                    Evaluasi:{' '}
                    {[
                      treatmentPlan.reviewIntervalText,
                      treatmentPlan.reviewAt ? formatShortDate(treatmentPlan.reviewAt) : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                ) : null}
                {treatmentPlan.precautions ? (
                  <p className="rounded-lg bg-[var(--hafta-red-50)] px-2.5 py-1.5 text-[10px] text-[var(--hafta-red-700)]">
                    Perhatian: {treatmentPlan.precautions}
                  </p>
                ) : null}
              </dl>
            </SectionCard>
          ) : null}

          {homeProgram ? (
            <SectionCard
              title="Program Latihan Mandiri"
              description={
                homeProgram.startsAt
                  ? `Mulai ${formatShortDate(homeProgram.startsAt)}${
                      homeProgram.endsAt ? ` · sampai ${formatShortDate(homeProgram.endsAt)}` : ''
                    }`
                  : 'Latihan yang dianjurkan fisioterapis Anda'
              }
              action={
                <Link
                  href="/dashboard/exercises"
                  className="inline-flex h-8 items-center gap-1 rounded-full border border-border bg-card px-2.5 text-[10px] font-semibold text-foreground transition-colors hover:bg-secondary"
                >
                  Buka
                  <ChevronRight className="h-3 w-3" />
                </Link>
              }
            >
              <ul className="space-y-1.5">
                {homeProgram.items.map((item, index) => (
                  <li key={item.id} className="rounded-xl bg-secondary/40 p-2.5">
                    <p className="text-[11px] font-bold text-foreground">
                      {index + 1}. {item.name}
                    </p>
                    <p className="mt-0.5 whitespace-pre-wrap text-[11px] leading-relaxed text-muted-foreground">
                      {item.instruction}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1 text-[9px] font-semibold text-foreground">
                      {item.sets ? <span className="rounded-full bg-card px-1.5 py-0.5">{item.sets} set</span> : null}
                      {item.repetitions ? (
                        <span className="rounded-full bg-card px-1.5 py-0.5">{item.repetitions} repetisi</span>
                      ) : null}
                      {item.durationSeconds ? (
                        <span className="rounded-full bg-card px-1.5 py-0.5">{item.durationSeconds} detik</span>
                      ) : null}
                      {item.frequencyText ? (
                        <span className="rounded-full bg-card px-1.5 py-0.5">{item.frequencyText}</span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </SectionCard>
          ) : null}
        </div>

        {/* ── ASIDE ── */}
        <aside className="space-y-3 sm:space-y-4 xl:sticky xl:top-[88px] xl:self-start">
          <SectionCard title="Ringkasan Terapi">
            <dl className="divide-y divide-border -my-1">
              <SummaryRow label="Status kasus" value={patient?.caseStatus ?? 'Aktif'} />
              <SummaryRow label="Mulai terapi" value={firstRecord ? formatShortDate(firstRecord.recordedAt) : '-'} />
              <SummaryRow label="Kunjungan" value={`${records.length} sesi`} />
              <SummaryRow label="Progres rata-rata" value={`${averageProgress}%`} />
            </dl>
            <div className="mt-3 border-t border-border pt-2.5">
              <h3 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                <Target className="h-3 w-3" />
                Target terapi
              </h3>
              <p className="mt-1 text-[11px] leading-relaxed text-foreground sm:text-xs">
                {patient?.therapyGoal ?? latestRecord?.followUpPlan ?? 'Belum ditentukan.'}
              </p>
            </div>
          </SectionCard>

          <SectionCard title="Diagnosis Terkini" description="Riwayat diagnosis terbaru">
            {recentDiagnoses.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">
                {latestRecord?.diagnosis ?? patient?.therapyDiagnosisLabel ?? 'Belum tersedia.'}
              </p>
            ) : (
              <ul className="space-y-1.5">
                {recentDiagnoses.map((record) => (
                  <li key={record.id}>
                    <button
                      type="button"
                      onClick={() => openRecord(record.id)}
                      className="group flex w-full cursor-pointer items-center gap-2 rounded-xl border border-border bg-secondary/30 p-2 text-left transition-colors hover:bg-secondary"
                    >
                      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', TONE_STYLES.good.dot)} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] font-semibold text-foreground">
                          {record.diagnosis}
                        </span>
                        <span className="block text-[9px] text-muted-foreground">
                          {formatShortDate(record.recordedAt)}
                        </span>
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {records.length > 0 ? (
              <button
                type="button"
                onClick={() => setActiveTab('diagnosis')}
                className="mt-2 inline-flex h-8 w-full items-center justify-center rounded-full text-[10px] font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                Lihat semua diagnosis
              </button>
            ) : null}
          </SectionCard>

          {patient?.therapistNote ? (
            <SectionCard title="Catatan Fisioterapis">
              <p className="text-[11px] leading-relaxed text-foreground sm:text-xs">{patient.therapistNote}</p>
              <p className="mt-2 text-[10px] text-muted-foreground">
                {patient.therapistNoteAuthor ?? patient.therapistName ?? 'Fisioterapis Hafta'}
                {patient.therapistNoteAt ? ` · ${formatShortDate(patient.therapistNoteAt)}` : ''}
              </p>
            </SectionCard>
          ) : null}

          <SectionCard title="Tim Terapi">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--hafta-100)] text-foreground">
                <UserRound className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-foreground">
                  {patient?.therapistName ?? latestRecord?.therapistName ?? 'Fisioterapis Hafta'}
                </p>
                <p className="text-[10px] text-muted-foreground">Fisioterapis pendamping</p>
              </div>
            </div>
            {patient?.therapyFrequencyText ? (
              <p className="mt-2.5 border-t border-border pt-2.5 text-[10px] leading-relaxed text-muted-foreground">
                Frekuensi terapi: {patient.therapyFrequencyText}
              </p>
            ) : null}
          </SectionCard>
        </aside>
      </div>

      {/* ── 4. TIMELINE RIWAYAT PERAWATAN ── */}
      {chronologicalRecords.length > 0 ? (
        <SectionCard
          title="Riwayat Perawatan"
          description="Urutan sesi terapi Anda"
          action={
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[9px] font-bold text-foreground">
              {records.length} sesi
            </span>
          }
        >
          <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pl-0.5 pr-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {chronologicalRecords.map((record, index) => {
              const isActive = record.id === selectedRecord?.id;
              return (
                <button
                  key={record.id}
                  type="button"
                  onClick={() => openRecord(record.id)}
                  aria-pressed={isActive}
                  className={cn(
                    'group relative w-[116px] shrink-0 snap-start rounded-xl border p-2 text-left transition-colors',
                    isActive
                      ? 'border-[var(--hafta-300)] bg-[var(--hafta-50)]'
                      : 'border-border bg-card hover:bg-secondary/40',
                  )}
                >
                  <span className="flex items-center justify-between gap-1">
                    <span
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-extrabold',
                        isActive
                          ? 'bg-[var(--hafta-300)] text-[var(--hafta-950)]'
                          : 'bg-secondary text-foreground',
                      )}
                    >
                      {index + 1}
                    </span>
                    <span className="text-[9px] font-semibold uppercase text-muted-foreground">
                      {formatMonth(record.recordedAt)}
                    </span>
                  </span>
                  <span className="mt-1.5 block text-[10px] font-bold text-foreground">
                    {formatShortDate(record.recordedAt)}
                  </span>
                  <span className="mt-1 flex items-center gap-1 text-[9px] text-muted-foreground">
                    <span className={cn('h-1 w-1 rounded-full', TONE_STYLES.good.dot)} />
                    Nyeri {record.painScore}/10
                  </span>
                  <span className="mt-0.5 flex items-center gap-1 text-[9px] text-muted-foreground">
                    <span className={cn('h-1 w-1 rounded-full', TONE_STYLES.optimal.dot)} />
                    Fungsi {record.functionScore}/10
                  </span>
                </button>
              );
            })}
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="truncate text-right text-[11px] font-bold text-foreground">{value}</dd>
    </div>
  );
}
