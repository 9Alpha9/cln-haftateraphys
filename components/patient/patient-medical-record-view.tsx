'use client';

import { useMemo, useState } from 'react';
import {
  Activity,
  ChevronRight,
  ClipboardList,
  FileText,
  Stethoscope,
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

const METRICS: { key: 'pain' | 'rom' | 'strength' | 'function'; label: string; field: keyof TherapyProgressView }[] = [
  { key: 'pain', label: 'Nyeri', field: 'painScore' },
  { key: 'rom', label: 'Rentang gerak (ROM)', field: 'rangeOfMotionScore' },
  { key: 'strength', label: 'Kekuatan otot', field: 'strengthScore' },
  { key: 'function', label: 'Fungsi fisik', field: 'functionScore' },
];

type Tone = 'optimal' | 'good' | 'attention';

function metricTone(key: string, score: number): { tone: Tone; label: string } {
  const value = Math.max(0, Math.min(10, Number(score)));
  if (key === 'pain') {
    if (value <= 3) return { tone: 'optimal', label: 'Dalam rentang' };
    if (value <= 6) return { tone: 'good', label: 'Perlu pemantauan' };
    return { tone: 'attention', label: 'Perlu evaluasi' };
  }
  if (value >= 8) return { tone: 'optimal', label: 'Dalam rentang' };
  if (value >= 6) return { tone: 'good', label: 'Perlu pemantauan' };
  return { tone: 'attention', label: 'Perlu evaluasi' };
}

const TONE_CHIP: Record<Tone, string> = {
  optimal: 'border-[var(--hafta-grn-300)]/60 bg-[var(--hafta-grn-50)] text-[var(--hafta-grn-700)]',
  good: 'border-[var(--hafta-300)]/50 bg-[var(--hafta-100)] text-[var(--hafta-800)]',
  attention: 'border-[var(--hafta-red-300)]/60 bg-[var(--hafta-red-50)] text-[var(--hafta-red-700)]',
};

const TONE_DOT: Record<Tone, string> = {
  optimal: 'bg-[var(--hafta-grn-500)]',
  good: 'bg-[var(--hafta-300)]',
  attention: 'bg-[var(--hafta-red-500)]',
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

function labelGender(value: string | null | undefined) {
  if (!value) return '-';
  return GENDER_LABEL[value.toUpperCase()] ?? value;
}

function labelCaseStatus(value: string | null | undefined) {
  if (!value) return 'Aktif';
  return CASE_STATUS_LABEL[value.toUpperCase()] ?? value;
}

function labelRecordStatus(value: TherapyProgressView['status']) {
  return value === 'FINALIZED' ? 'Final' : 'Draf';
}

function formatAge(dateOfBirth: Date | null) {
  if (!dateOfBirth) return '-';
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const month = today.getMonth() - dateOfBirth.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < dateOfBirth.getDate())) age -= 1;
  return `${age} tahun`;
}

const shortDate = (value: Date) =>
  value.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

const longDate = (value: Date) =>
  value.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

function delta(current: number, previous: number | null) {
  if (previous === null) return { text: '—', direction: 'same' as const };
  const diff = Number(current) - Number(previous);
  if (diff === 0) return { text: '0', direction: 'same' as const };
  return {
    text: `${diff > 0 ? '+' : ''}${diff}`,
    direction: diff > 0 ? ('up' as const) : ('down' as const),
  };
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

  function openRecord(recordId: string) {
    setSelectedRecordId(recordId);
    setActiveTab('ringkasan');
  }

  return (
    <div className="text-foreground">
      {/* breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span>Dashboard</span>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-foreground">Rekam Medis</span>
      </nav>

      {/* ── HEADER PASIEN ── */}
      <header className="mt-3 border-b border-border pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border text-sm font-bold sm:h-14 sm:w-14">
              {patient?.avatarKey ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={patient.avatarKey} alt="Foto pasien" className="h-full w-full object-cover" />
              ) : (
                (patient?.preferredName ?? patient?.fullName)?.[0]?.toUpperCase() ?? 'P'
              )}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
                  {patient?.preferredName ?? patient?.fullName ?? 'Pasien'}
                </h1>
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-foreground">
                  {labelCaseStatus(patient?.caseStatus)}
                </span>
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                <span>{formatAge(patient?.dateOfBirth ?? null)}</span>
                <span aria-hidden="true">·</span>
                <span>{labelGender(patient?.gender)}</span>
                <span aria-hidden="true">·</span>
                <span>No. RM {patient?.medicalRecordNumber ?? '-'}</span>
                <span aria-hidden="true">·</span>
                <span>{patient?.therapistName ?? latestRecord?.therapistName ?? 'Fisioterapis Hafta'}</span>
              </p>
            </div>
          </div>

          <dl className="grid shrink-0 grid-cols-3 gap-4 border-t border-border pt-3 text-left lg:border-t-0 lg:pt-0">
            <div>
              <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Total sesi</dt>
              <dd className="mt-0.5 text-lg font-semibold leading-none">{records.length}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Progres</dt>
              <dd className="mt-0.5 text-lg font-semibold leading-none">{averageScore}%</dd>
            </div>
            <div>
              <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Kunjungan berikutnya</dt>
              <dd className="mt-0.5 text-[13px] font-semibold leading-tight">
                {patient?.nextTherapyAt ? shortDate(patient.nextTherapyAt) : 'Belum dijadwalkan'}
              </dd>
            </div>
          </dl>
        </div>
      </header>

      {/* ── TABS ── */}
      <div className="mt-1 flex items-center gap-4 overflow-x-auto border-b border-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            aria-pressed={activeTab === tab.key}
            className={cn(
              'relative shrink-0 cursor-pointer whitespace-nowrap py-2.5 text-[11.5px] font-medium transition-colors sm:text-xs',
              activeTab === tab.key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
            <span
              className={cn(
                'absolute inset-x-0 -bottom-px h-0.5',
                activeTab === tab.key ? 'bg-foreground' : 'bg-transparent',
              )}
              aria-hidden="true"
            />
          </button>
        ))}
      </div>

      {/* ── KONTEN ── */}
      <div className="pt-4">
        {records.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <Activity className="h-6 w-6 text-muted-foreground" />
            <p className="mt-3 text-sm font-semibold">Belum ada rekam medis</p>
            <p className="mt-1 max-w-sm text-[11px] leading-relaxed text-muted-foreground">
              Catatan evaluasi akan tampil setelah fisioterapis menyelesaikan sesi dan membagikannya.
            </p>
          </div>
        ) : activeTab === 'ringkasan' && selectedRecord ? (
          <section>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold sm:text-[15px]">Evaluasi Terapi</h2>
                  <span
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                      selectedRecord.status === 'FINALIZED'
                        ? 'border-[var(--hafta-grn-300)]/60 bg-[var(--hafta-grn-50)] text-[var(--hafta-grn-700)]'
                        : 'border-border text-muted-foreground',
                    )}
                  >
                    {labelRecordStatus(selectedRecord.status)}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {longDate(selectedRecord.recordedAt)} · Sesi {visitNumberById.get(selectedRecord.id) ?? 1}
                </p>
              </div>
              <MedicalRecordActions record={selectedRecord} />
            </div>

            {/* parameter fisik */}
            <div className="mt-4">
              <div className="hidden grid-cols-[minmax(0,1.4fr)_repeat(5,minmax(0,1fr))_2rem] items-center gap-3 border-b border-border pb-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:grid">
                <span>Parameter</span>
                <span>Hasil</span>
                <span>Sebelumnya</span>
                <span>Perubahan</span>
                <span>Rentang</span>
                <span>Status</span>
                <span />
              </div>

              <div className="border-b border-border py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Parameter fisik · sesi {visitNumberById.get(selectedRecord.id) ?? 1}
              </div>

              {METRICS.map((metric) => {
                const current = Number(selectedRecord[metric.field] ?? 0);
                const previous = previousRecord ? Number(previousRecord[metric.field] ?? 0) : null;
                const change = delta(current, previous);
                const tone = metricTone(metric.key, current);
                return (
                  <div
                    key={metric.key}
                    className="grid gap-2 border-b border-border py-2.5 text-[11.5px] sm:grid-cols-[minmax(0,1.4fr)_repeat(5,minmax(0,1fr))_2rem] sm:items-center sm:gap-3"
                  >
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className={cn('h-1.5 w-1.5 rounded-full', TONE_DOT[tone.tone])} />
                      {metric.label}
                    </div>
                    <div className="flex items-baseline gap-1 sm:block">
                      <span className="text-[10px] text-muted-foreground sm:hidden">Hasil: </span>
                      <span className="font-semibold">{current}</span>
                      <span className="text-[10px] text-muted-foreground">/10</span>
                    </div>
                    <div className="flex items-baseline gap-1 sm:block">
                      <span className="text-[10px] text-muted-foreground sm:hidden">Sebelumnya: </span>
                      <span className="text-muted-foreground">{previous ?? '—'}</span>
                    </div>
                    <div className="flex items-baseline gap-1 sm:block">
                      <span className="text-[10px] text-muted-foreground sm:hidden">Perubahan: </span>
                      <span
                        className={cn(
                          'font-medium',
                          change.direction === 'same' && 'text-muted-foreground',
                          change.direction === 'up' && 'text-foreground',
                          change.direction === 'down' && 'text-foreground',
                        )}
                      >
                        {change.direction === 'up' ? '↑ ' : change.direction === 'down' ? '↓ ' : ''}
                        {change.text}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1 sm:block">
                      <span className="text-[10px] text-muted-foreground sm:hidden">Rentang: </span>
                      <span className="text-muted-foreground">0–10</span>
                    </div>
                    <div>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium',
                          TONE_CHIP[tone.tone],
                        )}
                      >
                        {tone.label}
                      </span>
                    </div>
                    <div className="hidden justify-end sm:flex">
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </div>
                );
              })}

              <div className="py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Catatan klinis
              </div>

              {CLINICAL_ROWS.map((row) => {
                const value = selectedRecord[row.field];
                return (
                  <div key={row.field} className="grid gap-1 border-b border-border py-2.5 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,4fr)] sm:gap-3">
                    <div className="text-[11.5px] font-medium">{row.label}</div>
                    <div className="whitespace-pre-wrap text-[11.5px] leading-relaxed text-muted-foreground">
                      {typeof value === 'string' && value ? (
                        <span className="text-foreground">{value}</span>
                      ) : (
                        'Tidak dicatat'
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* rencana & latihan — konten klinis */}
            {treatmentPlan ? (
              <div className="mt-5">
                <h3 className="text-[13px] font-semibold">Rencana Terapi</h3>
                <dl className="mt-1.5 divide-y divide-border border-y border-border text-[11.5px]">
                  <div className="grid gap-1 py-2.5 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,4fr)] sm:gap-3">
                    <dt className="font-medium">Tujuan</dt>
                    <dd className="whitespace-pre-wrap leading-relaxed text-muted-foreground">{treatmentPlan.goals}</dd>
                  </div>
                  <div className="grid gap-1 py-2.5 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,4fr)] sm:gap-3">
                    <dt className="font-medium">Intervensi</dt>
                    <dd className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                      {treatmentPlan.interventions}
                    </dd>
                  </div>
                  {treatmentPlan.reviewIntervalText || treatmentPlan.reviewAt ? (
                    <div className="grid gap-1 py-2.5 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,4fr)] sm:gap-3">
                      <dt className="font-medium">Evaluasi</dt>
                      <dd className="leading-relaxed text-muted-foreground">
                        {[
                          treatmentPlan.reviewIntervalText,
                          treatmentPlan.reviewAt ? shortDate(treatmentPlan.reviewAt) : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </dd>
                    </div>
                  ) : null}
                  {treatmentPlan.precautions ? (
                    <div className="grid gap-1 py-2.5 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,4fr)] sm:gap-3">
                      <dt className="font-medium">Perhatian</dt>
                      <dd className="leading-relaxed text-muted-foreground">{treatmentPlan.precautions}</dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            ) : null}

            {homeProgram ? (
              <div className="mt-5">
                <h3 className="text-[13px] font-semibold">Program Latihan Mandiri</h3>
                <dl className="mt-1.5 divide-y divide-border border-y border-border text-[11.5px]">
                  <div className="grid gap-1 py-2.5 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,4fr)] sm:gap-3">
                    <dt className="font-medium">Periode</dt>
                    <dd className="leading-relaxed text-muted-foreground">
                      {homeProgram.startsAt
                        ? `${shortDate(homeProgram.startsAt)}${
                            homeProgram.endsAt ? ` – ${shortDate(homeProgram.endsAt)}` : ''
                          }`
                        : 'Tanpa batas waktu'}
                    </dd>
                  </div>
                  {homeProgram.items.map((item, index) => (
                    <div
                      key={item.id}
                      className="grid gap-1 py-2.5 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,4fr)] sm:gap-3"
                    >
                      <dt className="font-medium">
                        {index + 1}. {item.name}
                      </dt>
                      <dd className="space-y-1 leading-relaxed text-muted-foreground">
                        <p className="whitespace-pre-wrap text-foreground">{item.instruction}</p>
                        <p className="text-[10.5px]">
                          {[
                            item.sets ? `${item.sets} set` : null,
                            item.repetitions ? `${item.repetitions} repetisi` : null,
                            item.durationSeconds ? `${item.durationSeconds} detik` : null,
                            item.frequencyText,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}

            {patient?.therapistNote ? (
              <div className="mt-5">
                <h3 className="text-[13px] font-semibold">Catatan Fisioterapis</h3>
                <p className="mt-1.5 border-y border-border py-2.5 text-[11.5px] leading-relaxed text-muted-foreground">
                  {patient.therapistNote}
                </p>
                <p className="mt-1.5 text-[10px] text-muted-foreground">
                  {patient.therapistNoteAuthor ?? patient.therapistName ?? 'Fisioterapis Hafta'}
                  {patient.therapistNoteAt ? ` · ${shortDate(patient.therapistNoteAt)}` : ''}
                </p>
              </div>
            ) : null}
          </section>
        ) : activeTab === 'kunjungan' ? (
          <section>
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold sm:text-[15px]">Riwayat Kunjungan</h2>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Pilih kunjungan untuk melihat detail evaluasi.
                </p>
              </div>
              <span className="text-[11px] text-muted-foreground">{records.length} sesi</span>
            </div>

            <div className="mt-3 hidden grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_repeat(4,minmax(0,0.7fr))_2rem] items-center gap-3 border-b border-border pb-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:grid">
              <span>Tanggal</span>
              <span>Terapis</span>
              <span>Nyeri</span>
              <span>ROM</span>
              <span>Kekuatan</span>
              <span>Fungsi</span>
              <span />
            </div>

            {visibleVisits.map((record) => (
              <button
                key={record.id}
                type="button"
                onClick={() => openRecord(record.id)}
                className="grid w-full cursor-pointer gap-1.5 border-b border-border py-3 text-left text-[11.5px] transition-colors hover:bg-secondary/40 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_repeat(4,minmax(0,0.7fr))_2rem] sm:items-center sm:gap-3"
              >
                <span className="font-medium">
                  {shortDate(record.recordedAt)}
                  <span className="ml-1.5 text-[10px] text-muted-foreground">
                    · Sesi {visitNumberById.get(record.id) ?? 0}
                  </span>
                </span>
                <span className="text-muted-foreground">{record.therapistName ?? 'Fisioterapis Hafta'}</span>
                <span>
                  <span className="text-[10px] text-muted-foreground sm:hidden">Nyeri: </span>
                  {record.painScore}/10
                </span>
                <span>
                  <span className="text-[10px] text-muted-foreground sm:hidden">ROM: </span>
                  {record.rangeOfMotionScore}/10
                </span>
                <span>
                  <span className="text-[10px] text-muted-foreground sm:hidden">Kekuatan: </span>
                  {record.strengthScore}/10
                </span>
                <span>
                  <span className="text-[10px] text-muted-foreground sm:hidden">Fungsi: </span>
                  {record.functionScore}/10
                </span>
                <span className="hidden justify-end sm:flex">
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </span>
              </button>
            ))}

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
          <section>
            <h2 className="text-sm font-semibold sm:text-[15px]">Diagnosis</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Diagnosis dan anamnesis tiap sesi.</p>

            <div className="mt-3 hidden grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)_minmax(0,2fr)] items-center gap-3 border-b border-border pb-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:grid">
              <span>Tanggal</span>
              <span>Diagnosis</span>
              <span>Anamnesis</span>
            </div>

            {records.map((record) => (
              <div
                key={record.id}
                className="grid gap-1 border-b border-border py-2.5 text-[11.5px] sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)_minmax(0,2fr)] sm:gap-3"
              >
                <span className="font-medium">{shortDate(record.recordedAt)}</span>
                <span>
                  <span className="text-[10px] text-muted-foreground sm:hidden">Diagnosis: </span>
                  {record.diagnosis || 'Tidak dicatat'}
                </span>
                <span className="leading-relaxed text-muted-foreground">
                  <span className="text-[10px] sm:hidden">Anamnesis: </span>
                  {record.anamnesis || 'Tidak dicatat'}
                </span>
              </div>
            ))}
          </section>
        ) : activeTab === 'tindakan' ? (
          <section>
            <h2 className="text-sm font-semibold sm:text-[15px]">Tindakan</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Pemeriksaan dan tindakan tiap sesi.</p>

            <div className="mt-3 hidden grid-cols-[minmax(0,1.1fr)_minmax(0,1.8fr)_minmax(0,1.8fr)] items-center gap-3 border-b border-border pb-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:grid">
              <span>Tanggal</span>
              <span>Pemeriksaan fisik</span>
              <span>Tindakan</span>
            </div>

            {records.map((record) => (
              <div
                key={record.id}
                className="grid gap-1 border-b border-border py-2.5 text-[11.5px] sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.8fr)_minmax(0,1.8fr)] sm:gap-3"
              >
                <span className="font-medium">{shortDate(record.recordedAt)}</span>
                <span className="leading-relaxed text-muted-foreground">
                  <span className="text-[10px] sm:hidden">Pemeriksaan: </span>
                  {record.physicalExamination || 'Tidak dicatat'}
                </span>
                <span className="leading-relaxed text-muted-foreground">
                  <span className="text-[10px] sm:hidden">Tindakan: </span>
                  {record.treatment || 'Tidak dicatat'}
                </span>
              </div>
            ))}
          </section>
        ) : (
          <section>
            <h2 className="text-sm font-semibold sm:text-[15px]">Dokumen</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Cetak atau unduh rekam medis resmi.</p>

            <div className="mt-3 hidden grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)_minmax(0,0.8fr)_2.5rem] items-center gap-3 border-b border-border pb-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:grid">
              <span>Tanggal</span>
              <span>Dokumen</span>
              <span>Status</span>
              <span />
            </div>

            {records.map((record) => (
              <div
                key={record.id}
                className="grid gap-1.5 border-b border-border py-2.5 text-[11.5px] sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)_minmax(0,0.8fr)_2.5rem] sm:items-center sm:gap-3"
              >
                <span className="font-medium">{shortDate(record.recordedAt)}</span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  Rekam medis sesi {visitNumberById.get(record.id) ?? 0}
                </span>
                <span className="text-muted-foreground">{labelRecordStatus(record.status)}</span>
                <div className="flex sm:justify-end">
                  <MedicalRecordActions record={record} />
                </div>
              </div>
            ))}
          </section>
        )}
      </div>

      {/* footer info */}
      {records.length > 0 ? (
        <div className="mt-4 flex flex-col gap-2 border-t border-border pt-3 text-[10.5px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-1.5">
            <ClipboardList className="h-3.5 w-3.5" />
            {records.length} rekam medis · mulai {firstRecord ? shortDate(firstRecord.recordedAt) : '-'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Stethoscope className="h-3.5 w-3.5" />
            {patient?.therapistName ?? latestRecord?.therapistName ?? 'Fisioterapis Hafta'}
          </span>
        </div>
      ) : null}
    </div>
  );
}
