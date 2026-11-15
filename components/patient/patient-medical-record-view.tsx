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
} from 'lucide-react';
import { GlobalSlideOver } from '@/components/ui/global-slide-over';
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
  short: string;
  field: keyof TherapyProgressView;
  icon: typeof HeartPulse;
}[] = [
  { key: 'pain', label: 'Nyeri', short: 'Nyeri', field: 'painScore', icon: HeartPulse },
  { key: 'rom', label: 'Rentang Gerak', short: 'ROM', field: 'rangeOfMotionScore', icon: Activity },
  { key: 'strength', label: 'Kekuatan', short: 'Kekuatan', field: 'strengthScore', icon: TrendingUp },
  { key: 'function', label: 'Fungsi', short: 'Fungsi', field: 'functionScore', icon: Activity },
];

type Tone = 'good' | 'watch' | 'alert';

function metricTone(key: string, score: number): { tone: Tone; label: string } {
  const value = Math.max(0, Math.min(10, Number(score)));
  if (key === 'pain') {
    if (value <= 3) return { tone: 'good', label: 'Ringan' };
    if (value <= 6) return { tone: 'watch', label: 'Sedang' };
    return { tone: 'alert', label: 'Tinggi' };
  }
  if (value >= 8) return { tone: 'good', label: 'Optimal' };
  if (value >= 6) return { tone: 'watch', label: 'Baik' };
  return { tone: 'alert', label: 'Rendah' };
}

const TONE_PILL: Record<Tone, string> = {
  good: 'bg-[var(--hafta-grn-50)] text-[var(--hafta-grn-700)]',
  watch: 'bg-[var(--hafta-50)] text-[var(--hafta-700)]',
  alert: 'bg-[var(--hafta-red-50)] text-[var(--hafta-red-700)]',
};

const TONE_DELTA: Record<'up' | 'down', string> = {
  up: 'text-[var(--hafta-grn-600)]',
  down: 'text-[var(--hafta-red-600)]',
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
  if (diff === 0) return null;
  return { text: `${diff > 0 ? '+' : ''}${diff}`, direction: diff > 0 ? ('up' as const) : ('down' as const) };
}

/** Delta dengan arah "baik/buruk": untuk Nyeri, turun = baik. */
function deltaForMetric(key: string, current: number, previous: number | null) {
  const change = deltaLabel(current, previous);
  if (!change) return null;
  const isGood = key === 'pain' ? change.direction === 'down' : change.direction === 'up';
  return { ...change, isGood };
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
  const [detailRecord, setDetailRecord] = useState<TherapyProgressView | null>(null);
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

  function openRecord(recordId: string) {
    setSelectedRecordId(recordId);
    setActiveTab('ringkasan');
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* ── 1. HEADER PASIEN — flat di kanvas, tanpa kartu ── */}
      <header className="border-b border-border pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            {patient?.preferredName ?? patient?.fullName ?? 'Pasien'}
          </h1>
          <span className="rounded-full bg-[var(--hafta-50)] px-2 py-0.5 text-[10px] font-semibold text-[var(--hafta-700)]">
            {labelCaseStatus(patient?.caseStatus)}
          </span>
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          <span>{formatAge(patient?.dateOfBirth ?? null)}</span>
          <span aria-hidden="true">·</span>
          <span>{labelGender(patient?.gender)}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">No. RM {patient?.medicalRecordNumber ?? '-'}</span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <Stethoscope className="h-3 w-3" />
            {patient?.therapistName ?? latestRecord?.therapistName ?? 'Fisioterapis Hafta'}
          </span>
        </p>
      </header>

      {/* ── 2. STAT PILLS — satu baris, tint token ── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          {
            icon: Activity,
            label: 'Total Sesi',
            value: `${records.length}`,
            detail: firstRecord ? `sejak ${shortDate(firstRecord.recordedAt)}` : 'belum ada sesi',
          },
          {
            icon: TrendingUp,
            label: 'Progres',
            value: `${averageScore}%`,
            detail: 'rata-rata ROM, kekuatan & fungsi',
          },
          {
            icon: CalendarDays,
            label: 'Berikutnya',
            value: patient?.nextTherapyAt ? shortDate(patient.nextTherapyAt) : '—',
            detail: patient?.therapyFrequencyText ?? 'belum dijadwalkan',
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-card p-2.5 shadow-[0_1px_2px_rgba(28,25,23,0.04)] sm:p-3.5">
            <stat.icon className="h-3.5 w-3.5 text-[var(--hafta-300)]" />
            <p className="mt-1.5 truncate text-[11px] font-semibold tabular-nums text-foreground sm:mt-2 sm:text-[15px]">
              {stat.value}
            </p>
            <p className="mt-0.5 truncate text-[9px] font-medium uppercase tracking-wide text-muted-foreground sm:text-[10px]">
              {stat.label}
            </p>
            <p className="mt-0.5 hidden truncate text-[10px] text-muted-foreground sm:block">{stat.detail}</p>
          </div>
        ))}
      </div>

      {/* ── 3. TABS ── */}
      <nav aria-label="Tab rekam medis" className="flex items-center gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            aria-pressed={activeTab === tab.key}
            className={cn(
              'relative shrink-0 cursor-pointer whitespace-nowrap pb-2 text-xs font-medium transition-colors focus-visible:border-[var(--hafta-950)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35',
              activeTab === tab.key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
            <span
              className={cn(
                'absolute inset-x-0 bottom-0 h-0.5 rounded-full',
                activeTab === tab.key ? 'bg-[var(--hafta-300)]' : 'bg-transparent',
              )}
              aria-hidden="true"
            />
          </button>
        ))}
      </nav>

      {/* ── 4. KONTEN ── */}
      {records.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl bg-card py-12 text-center shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
          <Activity className="h-6 w-6 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold text-foreground">Belum ada rekam medis</p>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
            Catatan evaluasi akan tampil setelah fisioterapis menyelesaikan sesi dan membagikannya.
          </p>
        </div>
      ) : activeTab === 'ringkasan' && selectedRecord ? (
        <div className="space-y-4">
          <section className="rounded-2xl bg-card p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)] sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold tracking-tight text-foreground">Perkembangan Terapi</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {longDate(selectedRecord.recordedAt)} · Sesi {visitNumberById.get(selectedRecord.id) ?? 1}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                    selectedRecord.status === 'FINALIZED'
                      ? TONE_PILL.good
                      : 'bg-secondary/60 text-muted-foreground',
                  )}
                >
                  {labelRecordStatus(selectedRecord.status)}
                </span>
                <MedicalRecordActions record={selectedRecord} />
              </div>
            </div>

            {/* metrik — tint pills */}
            <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
              {METRICS.map(({ key, label, short, field, icon: Icon }) => {
                const value = Number(selectedRecord[field] ?? 0);
                const previous = previousRecord ? Number(previousRecord[field] ?? 0) : null;
                const change = deltaForMetric(key, value, previous);
                const tone = metricTone(key, value);
                const history = chronological.slice(-6).map((record) => Number(record[field] ?? 0));
                return (
                  <div key={key} className="rounded-xl bg-[var(--hafta-50)] p-3">
                    <div className="flex items-center justify-between gap-1">
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                        <Icon className="h-3 w-3" />
                        {label}
                      </span>
                      <span className={cn('rounded-full px-1.5 py-0.5 text-[9px] font-semibold', TONE_PILL[tone.tone])}>
                        {tone.label}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-baseline gap-1">
                      <span className="text-xl font-semibold leading-none tabular-nums text-foreground sm:text-2xl">
                        {value}
                      </span>
                      <span className="text-[10px] text-muted-foreground">/10</span>
                      {change ? (
                        <span
                          className={cn(
                            'ml-auto text-[10px] font-semibold tabular-nums',
                            change.isGood ? TONE_DELTA.up : TONE_DELTA.down,
                          )}
                        >
                          {change.text}
                        </span>
                      ) : (
                        <span className="ml-auto text-[10px] text-muted-foreground">tetap</span>
                      )}
                    </div>
                    <div className="mt-2 flex h-5 items-end gap-1">
                      {history.map((score, index) => {
                        const height = Math.max(14, Math.min(100, key === 'pain' ? (10 - score) * 10 : score * 10));
                        return (
                          <span
                            key={`${key}-${index}`}
                            className={cn(
                              'flex-1 rounded-sm',
                              index === history.length - 1
                                ? 'bg-[var(--hafta-300)]'
                                : 'bg-[var(--hafta-200)]/40',
                            )}
                            style={{ height: `${height}%` }}
                          />
                        );
                      })}
                    </div>
                    <p className="sr-only">{short} sesi ini {value} dari 10.</p>
                  </div>
                );
              })}
            </div>

            {/* catatan klinis — baris hairline */}
            <dl className="mt-4 divide-y divide-border/70 border-t border-border/70">
              {CLINICAL_ROWS.map((row) => {
                const value = selectedRecord[row.field];
                return (
                  <div key={row.field} className="grid gap-0.5 py-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] sm:gap-4">
                    <dt className="text-[11px] font-medium text-muted-foreground sm:pt-px">{row.label}</dt>
                    <dd className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-foreground">
                      {typeof value === 'string' && value ? value : <span className="text-muted-foreground">Tidak dicatat</span>}
                    </dd>
                  </div>
                );
              })}
            </dl>

            {/* rencana terapi — hanya bila ada */}
            {treatmentPlan ? (
              <div className="mt-4 border-t border-border/70 pt-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rencana Terapi</h3>
                <dl className="mt-1 divide-y divide-border/70">
                  <div className="grid gap-0.5 py-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] sm:gap-4">
                    <dt className="text-[11px] font-medium text-muted-foreground sm:pt-px">Tujuan</dt>
                    <dd className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-foreground">{treatmentPlan.goals}</dd>
                  </div>
                  <div className="grid gap-0.5 py-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] sm:gap-4">
                    <dt className="text-[11px] font-medium text-muted-foreground sm:pt-px">Intervensi</dt>
                    <dd className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-foreground">
                      {treatmentPlan.interventions}
                    </dd>
                  </div>
                  {treatmentPlan.precautions ? (
                    <div className="grid gap-0.5 py-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] sm:gap-4">
                      <dt className="text-[11px] font-medium text-muted-foreground sm:pt-px">Perhatian</dt>
                      <dd className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-foreground">
                        {treatmentPlan.precautions}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            ) : null}

            {/* program latihan — hanya bila ada */}
            {homeProgram ? (
              <div className="mt-4 border-t border-border/70 pt-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Program Latihan Mandiri
                </h3>
                <ol className="mt-1 divide-y divide-border/70">
                  {homeProgram.items.map((item, index) => (
                    <li key={item.id} className="grid gap-0.5 py-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] sm:gap-4">
                      <span className="text-[11px] font-medium text-muted-foreground sm:pt-px">
                        {index + 1}. {item.name}
                      </span>
                      <span className="min-w-0">
                        <span className="block whitespace-pre-wrap text-[12.5px] leading-relaxed text-foreground">
                          {item.instruction}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-muted-foreground">
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
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
          </section>

          {/* catatan fisioterapis — hanya bila ada */}
          {patient?.therapistNote ? (
            <section className="rounded-2xl bg-card p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)] sm:p-5">
              <h3 className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Dumbbell className="h-3.5 w-3.5" />
                Catatan Fisioterapis
              </h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-foreground">{patient.therapistNote}</p>
              <p className="mt-1.5 text-[10px] text-muted-foreground">
                {patient.therapistNoteAuthor ?? patient.therapistName ?? 'Fisioterapis Hafta'}
                {patient.therapistNoteAt ? ` · ${shortDate(patient.therapistNoteAt)}` : ''}
              </p>
            </section>
          ) : null}
        </div>
      ) : activeTab === 'kunjungan' ? (
        <section className="rounded-2xl bg-card p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)] sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[15px] font-semibold tracking-tight text-foreground">Riwayat Kunjungan</h2>
            <span className="text-[11px] tabular-nums text-muted-foreground">{records.length} sesi</span>
          </div>

          <ul className="mt-2 divide-y divide-border/70">
            {visibleVisits.map((record) => (
              <li key={record.id}>
                <button
                  type="button"
                  onClick={() => setDetailRecord(record)}
                  className="flex w-full cursor-pointer items-center gap-3 py-3 text-left transition-colors focus-visible:border-[var(--hafta-950)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
                >
                  <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-[var(--hafta-50)]">
                    <span className="text-[13px] font-semibold leading-none tabular-nums text-foreground">
                      {record.recordedAt.getDate()}
                    </span>
                    <span className="mt-0.5 text-[8px] uppercase tracking-wide text-muted-foreground">
                      {record.recordedAt.toLocaleDateString('id-ID', { month: 'short' })}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-medium text-foreground">
                      Sesi {visitNumberById.get(record.id) ?? 0}
                      <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">
                        {record.therapistName ?? 'Fisioterapis Hafta'}
                      </span>
                    </span>
                    <span className="mt-0.5 flex flex-wrap gap-x-2.5 text-[10.5px] tabular-nums text-muted-foreground">
                      <span>Nyeri {record.painScore}</span>
                      <span>ROM {record.rangeOfMotionScore}</span>
                      <span>Kekuatan {record.strengthScore}</span>
                      <span>Fungsi {record.functionScore}</span>
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>

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
        </section>
      ) : activeTab === 'diagnosis' ? (
        <section className="rounded-2xl bg-card p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)] sm:p-5">
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground">Diagnosis</h2>
          <ul className="mt-2 divide-y divide-border/70">
            {records.map((record) => (
              <li key={record.id} className="grid gap-0.5 py-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-4">
                <span className="min-w-0">
                  <span className="block truncate text-[12.5px] font-medium text-foreground">
                    {record.diagnosis || 'Tidak dicatat'}
                  </span>
                  <span className="block text-[10.5px] tabular-nums text-muted-foreground">
                    {shortDate(record.recordedAt)}
                  </span>
                </span>
                <span className="whitespace-pre-wrap text-[11.5px] leading-relaxed text-muted-foreground">
                  {record.anamnesis || 'Anamnesis tidak dicatat'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : activeTab === 'tindakan' ? (
        <section className="rounded-2xl bg-card p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)] sm:p-5">
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground">Tindakan</h2>
          <ul className="mt-2 divide-y divide-border/70">
            {records.map((record) => (
              <li key={record.id} className="grid gap-1 py-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-4">
                <span className="min-w-0">
                  <span className="block truncate text-[12.5px] font-medium text-foreground">
                    Sesi {visitNumberById.get(record.id) ?? 0}
                  </span>
                  <span className="block text-[10.5px] tabular-nums text-muted-foreground">
                    {shortDate(record.recordedAt)}
                  </span>
                </span>
                <span className="min-w-0">
                  <span className="block whitespace-pre-wrap text-[11.5px] leading-relaxed text-muted-foreground">
                    {record.physicalExamination || 'Pemeriksaan tidak dicatat'}
                  </span>
                  <span className="mt-1 block whitespace-pre-wrap text-[11.5px] leading-relaxed text-foreground">
                    {record.treatment || 'Tindakan tidak dicatat'}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="rounded-2xl bg-card p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)] sm:p-5">
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground">Dokumen</h2>
          <ul className="mt-2 divide-y divide-border/70">
            {records.map((record) => (
              <li key={record.id} className="flex items-center gap-3 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--hafta-50)] text-muted-foreground">
                  <FileText className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-medium text-foreground">
                    Rekam medis sesi {visitNumberById.get(record.id) ?? 0}
                  </span>
                  <span className="block text-[10.5px] tabular-nums text-muted-foreground">
                    {shortDate(record.recordedAt)} · {labelRecordStatus(record.status)}
                  </span>
                </span>
                <MedicalRecordActions record={record} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── SLIDE-OVER: detail evaluasi per kunjungan ── */}
      <GlobalSlideOver
        isOpen={detailRecord !== null}
        onClose={() => setDetailRecord(null)}
        icon={<Stethoscope className="h-4 w-4" />}
        title={
          detailRecord ? `Evaluasi Terapi · Sesi ${visitNumberById.get(detailRecord.id) ?? 1}` : 'Evaluasi Terapi'
        }
        subtitle={detailRecord ? longDate(detailRecord.recordedAt) : undefined}
        badge={
          detailRecord ? (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                detailRecord.status === 'FINALIZED' ? TONE_PILL.good : 'bg-secondary/60 text-muted-foreground',
              )}
            >
              {labelRecordStatus(detailRecord.status)}
            </span>
          ) : undefined
        }
        size="md"
        footer={
          detailRecord ? (
            <div className="flex justify-end">
              <MedicalRecordActions record={detailRecord} />
            </div>
          ) : null
        }
      >
        {detailRecord ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {METRICS.map(({ key, label, field, icon: Icon }) => {
                const value = Number(detailRecord[field] ?? 0);
                const tone = metricTone(key, value);
                return (
                  <div key={key} className="rounded-xl bg-[var(--hafta-50)] p-3">
                    <div className="flex items-center justify-between gap-1">
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                        <Icon className="h-3 w-3" />
                        {label}
                      </span>
                      <span className={cn('rounded-full px-1.5 py-0.5 text-[9px] font-semibold', TONE_PILL[tone.tone])}>
                        {tone.label}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xl font-semibold leading-none tabular-nums text-foreground">
                      {value}
                      <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">/10</span>
                    </p>
                  </div>
                );
              })}
            </div>

            <dl className="divide-y divide-border/70 border-y border-border/70">
              {CLINICAL_ROWS.map((row) => {
                const value = detailRecord[row.field];
                return (
                  <div key={row.field} className="grid gap-0.5 py-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] sm:gap-4">
                    <dt className="text-[11px] font-medium text-muted-foreground sm:pt-px">{row.label}</dt>
                    <dd className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-foreground">
                      {typeof value === 'string' && value ? value : <span className="text-muted-foreground">Tidak dicatat</span>}
                    </dd>
                  </div>
                );
              })}
            </dl>

            <p className="text-[10px] text-muted-foreground">
              Fisioterapis: {detailRecord.therapistName ?? 'Fisioterapis Hafta'}
            </p>
          </div>
        ) : null}
      </GlobalSlideOver>
    </div>
  );
}
