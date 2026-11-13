'use client';

import { useMemo, useState } from 'react';
import {
  Activity,
  CalendarDays,
  ChevronRight,
  Dumbbell,
  FileText,
  HeartPulse,
  Stethoscope,
  TrendingUp,
  UserRound,
} from 'lucide-react';
import { MedicalRecordActions } from '@/components/dashboard/medical-record-actions';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { cn } from '@/lib/utils';
import type { PatientMedicalRecordSummary, TherapyProgressView } from '@/server/queries/therapy-progress';
import type { HomeProgramView } from '@/server/queries/home-programs';
import type { TreatmentPlanView } from '@/server/queries/treatment-plans';

type TabKey = 'ringkasan' | 'kunjungan' | 'diagnosis' | 'tindakan' | 'dokumen';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'ringkasan', label: 'Ringkasan' },
  { key: 'kunjungan', label: 'Kunjungan' },
  { key: 'diagnosis', label: 'Diagnosis' },
  { key: 'tindakan', label: 'Tindakan' },
  { key: 'dokumen', label: 'Dokumen' },
];

const CLINICAL_ROWS: { label: string; field: keyof TherapyProgressView }[] = [
  { label: 'Anamnesis', field: 'anamnesis' },
  { label: 'Pemeriksaan fisik', field: 'physicalExamination' },
  { label: 'Diagnosis fisioterapi', field: 'diagnosis' },
  { label: 'Tindakan', field: 'treatment' },
  { label: 'Rencana tindak lanjut', field: 'followUpPlan' },
  { label: 'Ringkasan sesi', field: 'summary' },
];

const METRICS: {
  key: 'pain' | 'rom' | 'strength' | 'function';
  label: string;
  field: keyof TherapyProgressView;
  icon: typeof HeartPulse;
}[] = [
  { key: 'pain', label: 'Nyeri', field: 'painScore', icon: HeartPulse },
  { key: 'rom', label: 'ROM', field: 'rangeOfMotionScore', icon: Activity },
  { key: 'strength', label: 'Kekuatan', field: 'strengthScore', icon: TrendingUp },
  { key: 'function', label: 'Fungsi', field: 'functionScore', icon: UserRound },
];

type Tone = 'optimal' | 'good' | 'attention';

function metricTone(key: string, score: number): { tone: Tone; label: string } {
  const value = Math.max(0, Math.min(10, Number(score)));
  if (key === 'pain') {
    if (value <= 3) return { tone: 'optimal', label: 'Ringan' };
    if (value <= 6) return { tone: 'good', label: 'Sedang' };
    return { tone: 'attention', label: 'Tinggi' };
  }
  if (value >= 8) return { tone: 'optimal', label: 'Optimal' };
  if (value >= 6) return { tone: 'good', label: 'Baik' };
  return { tone: 'attention', label: 'Rendah' };
}

const TONE_PILL: Record<Tone, string> = {
  optimal: 'bg-[var(--hafta-grn-500)]/10 text-[var(--hafta-grn-700)]',
  good: 'bg-[var(--hafta-300)]/12 text-[var(--hafta-700)]',
  attention: 'bg-[var(--hafta-red-500)]/10 text-[var(--hafta-red-700)]',
};

const TONE_BAR: Record<Tone, string> = {
  optimal: 'bg-[var(--hafta-grn-500)]',
  good: 'bg-[var(--hafta-300)]',
  attention: 'bg-[var(--hafta-red-400)]',
};

const GENDER_LABEL: Record<string, string> = {
  MALE: 'Laki-laki',
  M: 'Laki-laki',
  PRIA: 'Laki-laki',
  LAKI_LAKI: 'Laki-laki',
  FEMALE: 'Perempuan',
  F: 'Perempuan',
  WANITA: 'Perempuan',
  PEREMPUAN: 'Perempuan',
};

const CASE_STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Aktif',
  INACTIVE: 'Tidak aktif',
  DISCHARGED: 'Selesai terapi',
  ON_HOLD: 'Ditunda',
  ARCHIVED: 'Diarsipkan',
};

const labelGender = (value: string | null | undefined) =>
  value ? GENDER_LABEL[value.toUpperCase()] ?? value : '-';

const labelCaseStatus = (value: string | null | undefined) =>
  value ? CASE_STATUS_LABEL[value.toUpperCase()] ?? value : 'Aktif';

const labelRecordStatus = (value: TherapyProgressView['status']) =>
  value === 'FINALIZED' ? 'Final' : 'Draf';

const shortDate = (value: Date) =>
  value.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

const longDate = (value: Date) =>
  value.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

function formatAge(dateOfBirth: Date | null) {
  if (!dateOfBirth) return '-';
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const month = today.getMonth() - dateOfBirth.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < dateOfBirth.getDate())) age -= 1;
  return `${age} tahun`;
}

function deltaLabel(current: number, previous: number | null) {
  if (previous === null) return null;
  const diff = Number(current) - Number(previous);
  if (diff === 0) return { text: 'tetap', direction: 'same' as const };
  return { text: `${Math.abs(diff)}`, direction: diff > 0 ? ('up' as const) : ('down' as const) };
}

function SoftCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        'rounded-2xl bg-white p-3.5 shadow-[0_1px_2px_rgba(28,25,23,0.04),0_12px_32px_-18px_rgba(28,25,23,0.18)] sm:rounded-3xl sm:p-4',
        className,
      )}
    >
      {children}
    </section>
  );
}

function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-[13px] font-semibold tracking-tight text-foreground sm:text-sm">
        {children}
      </h2>
      {action}
    </div>
  );
}

function SoftRow({
  className,
  onClick,
  children,
}: {
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const base = cn(
    'flex w-full items-center gap-2.5 rounded-xl bg-[#F7F4F0] px-2.5 py-2 text-left sm:px-3 sm:py-2.5',
    onClick && 'cursor-pointer transition-colors hover:bg-[#F1ECE6]',
    className,
  );
  return onClick ? (
    <button type="button" onClick={onClick} className={base}>
      {children}
    </button>
  ) : (
    <div className={base}>{children}</div>
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
  const [activeTab, setActiveTab] = useState<TabKey>('ringkasan');
  const [selectedRecordId, setSelectedRecordId] = useState(records[0]?.id ?? '');
  const [visitPage, setVisitPage] = useState(1);
  const [visitsPerPage, setVisitsPerPage] = useState(5);

  const selectedRecord = useMemo(
    () => records.find((record) => record.id === selectedRecordId) ?? records[0] ?? null,
    [records, selectedRecordId],
  );

  const chronological = useMemo(
    () => [...records].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()),
    [records],
  );

  const previousRecord = useMemo(() => {
    if (!selectedRecord) return null;
    const index = chronological.findIndex((record) => record.id === selectedRecord.id);
    return index > 0 ? chronological[index - 1] : null;
  }, [chronological, selectedRecord]);

  const visitNumberById = useMemo(
    () => new Map(chronological.map((record, index) => [record.id, index + 1])),
    [chronological],
  );

  const latestRecord = records[0] ?? null;
  const firstRecord = chronological[0] ?? null;
  const visitPageCount = Math.max(1, Math.ceil(records.length / visitsPerPage));
  const safeVisitPage = Math.min(visitPage, visitPageCount);
  const visibleVisits = records.slice((safeVisitPage - 1) * visitsPerPage, safeVisitPage * visitsPerPage);
  const averageScore = records.length
    ? Math.round(
        (records.reduce(
          (total, record) => total + record.rangeOfMotionScore + record.strengthScore + record.functionScore,
          0,
        ) /
          (records.length * 30)) *
          100,
      )
    : 0;
  const trend = useMemo(() => chronological.slice(-8), [chronological]);
  const conditions = useMemo(
    () =>
      records
        .filter((record) => Boolean(record.diagnosis))
        .slice(0, 4)
        .map((record) => ({ id: record.id, label: record.diagnosis as string, date: record.recordedAt })),
    [records],
  );

  function openRecord(recordId: string) {
    setSelectedRecordId(recordId);
    setActiveTab('ringkasan');
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* ── HEADER PASIEN ── */}
      <SoftCard className="p-3.5 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#F1ECE6] text-sm font-bold text-foreground sm:h-16 sm:w-16 sm:text-base">
            {patient?.avatarKey ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={patient.avatarKey} alt="Foto pasien" className="h-full w-full object-cover" />
            ) : (
              (patient?.preferredName ?? patient?.fullName)?.[0]?.toUpperCase() ?? 'P'
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">
                {patient?.preferredName ?? patient?.fullName ?? 'Pasien'}
              </h1>
              <span className="rounded-full bg-[var(--hafta-300)]/12 px-2 py-0.5 text-[10px] font-semibold text-[var(--hafta-700)]">
                {labelCaseStatus(patient?.caseStatus)}
              </span>
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
              <span>{formatAge(patient?.dateOfBirth ?? null)}</span>
              <span>{labelGender(patient?.gender)}</span>
              <span>RM {patient?.medicalRecordNumber ?? '-'}</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#F7F4F0] px-2.5 py-1 text-[10.5px] font-medium text-foreground">
                <Stethoscope className="h-3 w-3 text-muted-foreground" />
                {patient?.therapistName ?? latestRecord?.therapistName ?? 'Fisioterapis Hafta'}
              </span>
              {patient?.therapyFrequencyText ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#F7F4F0] px-2.5 py-1 text-[10.5px] font-medium text-foreground">
                  <CalendarDays className="h-3 w-3 text-muted-foreground" />
                  {patient.therapyFrequencyText}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 sm:mt-4">
          {[
            { label: 'Total sesi', value: `${records.length}` },
            { label: 'Progres', value: `${averageScore}%` },
            {
              label: 'Berikutnya',
              value: patient?.nextTherapyAt ? shortDate(patient.nextTherapyAt) : 'Belum ada',
            },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-[#F7F4F0] px-2.5 py-2">
              <p className="text-[9.5px] font-medium uppercase tracking-wide text-muted-foreground">
                {stat.label}
              </p>
              <p className="mt-0.5 truncate text-[13px] font-semibold leading-tight text-foreground sm:text-sm">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </SoftCard>

      {/* ── TABS ── */}
      <div className="flex items-center gap-4 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            aria-pressed={activeTab === tab.key}
            className={cn(
              'relative shrink-0 cursor-pointer whitespace-nowrap pb-2 text-[11.5px] font-medium transition-colors sm:text-xs',
              activeTab === tab.key
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
            <span
              className={cn(
                'absolute inset-x-0 bottom-0 h-[2px] rounded-full transition-colors',
                activeTab === tab.key ? 'bg-[var(--hafta-400)]' : 'bg-transparent',
              )}
              aria-hidden="true"
            />
          </button>
        ))}
      </div>

      {/* ── KONTEN ── */}
      {records.length === 0 ? (
        <SoftCard>
          <div className="flex flex-col items-center py-10 text-center">
            <Activity className="h-6 w-6 text-muted-foreground" />
            <p className="mt-3 text-sm font-semibold">Belum ada rekam medis</p>
            <p className="mt-1 max-w-sm text-[11px] leading-relaxed text-muted-foreground">
              Catatan evaluasi akan tampil setelah fisioterapis menyelesaikan sesi dan membagikannya.
            </p>
          </div>
        </SoftCard>
      ) : activeTab === 'ringkasan' && selectedRecord ? (
        <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
          {/* perkembangan */}
          <SoftCard className="lg:col-span-2">
            <SectionTitle
              action={
                <span className="rounded-full bg-[#F7F4F0] px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Sesi {visitNumberById.get(selectedRecord.id) ?? 1}
                </span>
              }
            >
              Perkembangan Terapi
            </SectionTitle>
            <p className="mt-0.5 text-[10.5px] text-muted-foreground">
              {longDate(selectedRecord.recordedAt)}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {METRICS.map(({ key, label, field, icon: Icon }) => {
                const value = Number(selectedRecord[field] ?? 0);
                const previous = previousRecord ? Number(previousRecord[field] ?? 0) : null;
                const change = deltaLabel(value, previous);
                const tone = metricTone(key, value);
                const history = chronological.slice(-6).map((record) => Number(record[field] ?? 0));
                return (
                  <div key={key} className="rounded-xl bg-[#F7F4F0] p-2.5 sm:p-3">
                    <div className="flex items-center justify-between gap-1">
                      <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                        <Icon className="h-3 w-3" />
                        {label}
                      </span>
                      <span className={cn('rounded-full px-1.5 py-0.5 text-[9px] font-semibold', TONE_PILL[tone.tone])}>
                        {tone.label}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-baseline gap-1">
                      <span className="text-xl font-semibold leading-none text-foreground">{value}</span>
                      <span className="text-[10px] text-muted-foreground">/10</span>
                      {change ? (
                        <span className="ml-auto text-[9.5px] font-medium text-muted-foreground">
                          {change.direction === 'up' ? '↑' : change.direction === 'down' ? '↓' : '·'} {change.text}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 flex h-6 items-end gap-1">
                      {history.map((score, index) => {
                        const height = Math.max(12, Math.min(100, key === 'pain' ? (10 - score) * 10 : score * 10));
                        return (
                          <span
                            key={`${key}-${index}`}
                            className={cn(
                              'flex-1 rounded-sm',
                              index === history.length - 1 ? TONE_BAR[tone.tone] : 'bg-foreground/10',
                            )}
                            style={{ height: `${height}%` }}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3.5">
              <SectionTitle>Catatan Klinis</SectionTitle>
              <div className="mt-2 space-y-1.5">
                {CLINICAL_ROWS.map((row) => {
                  const value = selectedRecord[row.field];
                  if (typeof value !== 'string' || !value) return null;
                  return (
                    <SoftRow key={row.field} className="items-start">
                      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--hafta-300)]" />
                      <span className="min-w-0">
                        <span className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          {row.label}
                        </span>
                        <span className="mt-0.5 block whitespace-pre-wrap text-[11.5px] leading-relaxed text-foreground">
                          {value}
                        </span>
                      </span>
                    </SoftRow>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <MedicalRecordActions record={selectedRecord} />
            </div>
          </SoftCard>

          {/* diagnosis + riwayat */}
          <div className="space-y-3 sm:space-y-4">
            <SoftCard>
              <SectionTitle
                action={
                  <button
                    type="button"
                    onClick={() => setActiveTab('diagnosis')}
                    className="text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Lihat semua
                  </button>
                }
              >
                Diagnosis
              </SectionTitle>
              <div className="mt-2 space-y-1.5">
                {conditions.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground">Belum ada diagnosis.</p>
                ) : (
                  conditions.map((condition) => (
                    <SoftRow key={condition.id} onClick={() => openRecord(condition.id)}>
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--hafta-300)]/12 text-[var(--hafta-700)]">
                        <Stethoscope className="h-3 w-3" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] font-medium text-foreground">
                          {condition.label}
                        </span>
                        <span className="block text-[9.5px] text-muted-foreground">
                          {shortDate(condition.date)}
                        </span>
                      </span>
                      <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                    </SoftRow>
                  ))
                )}
              </div>
            </SoftCard>

            <SoftCard>
              <SectionTitle
                action={
                  <button
                    type="button"
                    onClick={() => setActiveTab('kunjungan')}
                    className="text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Riwayat
                  </button>
                }
              >
                Kunjungan Terakhir
              </SectionTitle>
              <div className="mt-2 space-y-1.5">
                {records.slice(0, 3).map((record) => (
                  <SoftRow key={record.id} onClick={() => openRecord(record.id)}>
                    <span className="flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded-lg bg-white">
                      <span className="text-[11px] font-semibold leading-none text-foreground">
                        {record.recordedAt.getDate()}
                      </span>
                      <span className="mt-0.5 text-[7.5px] uppercase text-muted-foreground">
                        {record.recordedAt.toLocaleDateString('id-ID', { month: 'short' })}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-medium text-foreground">
                        Sesi {visitNumberById.get(record.id) ?? 0}
                      </span>
                      <span className="block truncate text-[9.5px] text-muted-foreground">
                        {record.therapistName ?? 'Fisioterapis Hafta'}
                      </span>
                    </span>
                    <span className="shrink-0 text-[9.5px] font-medium text-muted-foreground">
                      {labelRecordStatus(record.status)}
                    </span>
                  </SoftRow>
                ))}
              </div>
            </SoftCard>

            {treatmentPlan ? (
              <SoftCard>
                <SectionTitle>Rencana Terapi</SectionTitle>
                <div className="mt-2 space-y-1.5">
                  <SoftRow className="items-start">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--hafta-300)]" />
                    <span className="min-w-0">
                      <span className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Tujuan
                      </span>
                      <span className="mt-0.5 block whitespace-pre-wrap text-[11px] leading-relaxed text-foreground">
                        {treatmentPlan.goals}
                      </span>
                    </span>
                  </SoftRow>
                  <SoftRow className="items-start">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--hafta-300)]" />
                    <span className="min-w-0">
                      <span className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Intervensi
                      </span>
                      <span className="mt-0.5 block whitespace-pre-wrap text-[11px] leading-relaxed text-foreground">
                        {treatmentPlan.interventions}
                      </span>
                    </span>
                  </SoftRow>
                </div>
              </SoftCard>
            ) : null}
          </div>
        </div>
      ) : activeTab === 'kunjungan' ? (
        <SoftCard>
          <SectionTitle
            action={
              <span className="text-[10px] font-medium text-muted-foreground">{records.length} sesi</span>
            }
          >
            Riwayat Kunjungan
          </SectionTitle>
          <div className="mt-2 space-y-1.5">
            {visibleVisits.map((record) => (
              <SoftRow key={record.id} onClick={() => openRecord(record.id)}>
                <span className="flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded-lg bg-white">
                  <span className="text-[11px] font-semibold leading-none text-foreground">
                    {record.recordedAt.getDate()}
                  </span>
                  <span className="mt-0.5 text-[7.5px] uppercase text-muted-foreground">
                    {record.recordedAt.toLocaleDateString('id-ID', { month: 'short' })}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11.5px] font-medium text-foreground">
                    Sesi {visitNumberById.get(record.id) ?? 0}
                    <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">
                      {record.therapistName ?? 'Fisioterapis Hafta'}
                    </span>
                  </span>
                  <span className="mt-0.5 flex flex-wrap gap-x-2 text-[9.5px] text-muted-foreground">
                    <span>Nyeri {record.painScore}</span>
                    <span>ROM {record.rangeOfMotionScore}</span>
                    <span>Kekuatan {record.strengthScore}</span>
                    <span>Fungsi {record.functionScore}</span>
                  </span>
                </span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </SoftRow>
            ))}
          </div>
          <PaginationBar
            page={safeVisitPage}
            pageCount={visitPageCount}
            pageSize={visitsPerPage}
            pageSizeOptions={[5, 10, 25]}
            onPageChange={setVisitPage}
            onPageSizeChange={(size) => {
              setVisitsPerPage(size);
              setVisitPage(1);
            }}
          />
        </SoftCard>
      ) : activeTab === 'diagnosis' ? (
        <SoftCard>
          <SectionTitle>Diagnosis</SectionTitle>
          <p className="mt-0.5 text-[10.5px] text-muted-foreground">Diagnosis dan anamnesis tiap sesi.</p>
          <div className="mt-2 space-y-1.5">
            {records.map((record) => (
              <SoftRow key={record.id} className="items-start">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--hafta-300)]" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[11px] font-medium text-foreground">
                      {record.diagnosis || 'Tidak dicatat'}
                    </span>
                    <span className="shrink-0 text-[9.5px] text-muted-foreground">
                      {shortDate(record.recordedAt)}
                    </span>
                  </span>
                  <span className="mt-0.5 block whitespace-pre-wrap text-[10.5px] leading-relaxed text-muted-foreground">
                    {record.anamnesis || 'Anamnesis tidak dicatat'}
                  </span>
                </span>
              </SoftRow>
            ))}
          </div>
        </SoftCard>
      ) : activeTab === 'tindakan' ? (
        <SoftCard>
          <SectionTitle>Tindakan</SectionTitle>
          <p className="mt-0.5 text-[10.5px] text-muted-foreground">Pemeriksaan dan tindakan tiap sesi.</p>
          <div className="mt-2 space-y-1.5">
            {records.map((record) => (
              <SoftRow key={record.id} className="items-start">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--hafta-300)]" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[11px] font-medium text-foreground">
                      Sesi {visitNumberById.get(record.id) ?? 0}
                    </span>
                    <span className="shrink-0 text-[9.5px] text-muted-foreground">
                      {shortDate(record.recordedAt)}
                    </span>
                  </span>
                  <span className="mt-0.5 block whitespace-pre-wrap text-[10.5px] leading-relaxed text-muted-foreground">
                    {record.physicalExamination || 'Pemeriksaan tidak dicatat'}
                  </span>
                  <span className="mt-0.5 block whitespace-pre-wrap text-[10.5px] leading-relaxed text-foreground">
                    {record.treatment || 'Tindakan tidak dicatat'}
                  </span>
                </span>
              </SoftRow>
            ))}
          </div>
        </SoftCard>
      ) : (
        <SoftCard>
          <SectionTitle>Dokumen</SectionTitle>
          <p className="mt-0.5 text-[10.5px] text-muted-foreground">Cetak atau unduh rekam medis resmi.</p>
          <div className="mt-2 space-y-1.5">
            {records.map((record) => (
              <SoftRow key={record.id}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] font-medium text-foreground">
                    Rekam medis sesi {visitNumberById.get(record.id) ?? 0}
                  </span>
                  <span className="block truncate text-[9.5px] text-muted-foreground">
                    {shortDate(record.recordedAt)} · {labelRecordStatus(record.status)}
                  </span>
                </span>
                <MedicalRecordActions record={record} />
              </SoftRow>
            ))}
          </div>
        </SoftCard>
      )}

      {/* ── PROGRAM LATIHAN ── */}
      {homeProgram && activeTab === 'ringkasan' ? (
        <SoftCard>
          <SectionTitle
            action={
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                <Dumbbell className="h-3 w-3" />
                {homeProgram.startsAt ? shortDate(homeProgram.startsAt) : 'Aktif'}
              </span>
            }
          >
            Program Latihan Mandiri
          </SectionTitle>
          <div className="mt-2 space-y-1.5">
            {homeProgram.items.map((item, index) => (
              <SoftRow key={item.id} className="items-start">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--hafta-300)]/12 text-[9px] font-semibold text-[var(--hafta-700)]">
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-[11px] font-medium text-foreground">{item.name}</span>
                  <span className="mt-0.5 block whitespace-pre-wrap text-[10.5px] leading-relaxed text-muted-foreground">
                    {item.instruction}
                  </span>
                  <span className="mt-0.5 block text-[9.5px] text-muted-foreground">
                    {[
                      item.sets ? `${item.sets} set` : null,
                      item.repetitions ? `${item.repetitions} repetisi` : null,
                      item.durationSeconds ? `${item.durationSeconds} detik` : null,
                      item.frequencyText,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
              </SoftRow>
            ))}
          </div>
        </SoftCard>
      ) : null}

      {patient?.therapistNote && activeTab === 'ringkasan' ? (
        <SoftCard>
          <SectionTitle>Catatan Fisioterapis</SectionTitle>
          <p className="mt-1.5 whitespace-pre-wrap text-[11px] leading-relaxed text-foreground">
            {patient.therapistNote}
          </p>
          <p className="mt-1.5 text-[9.5px] text-muted-foreground">
            {patient.therapistNoteAuthor ?? patient.therapistName ?? 'Fisioterapis Hafta'}
            {patient.therapistNoteAt ? ` · ${shortDate(patient.therapistNoteAt)}` : ''}
          </p>
        </SoftCard>
      ) : null}

      {records.length > 0 ? (
        <p className="px-1 pb-1 text-[10px] text-muted-foreground">
          {records.length} rekam medis · mulai {firstRecord ? shortDate(firstRecord.recordedAt) : '-'}
        </p>
      ) : null}
    </div>
  );
}
