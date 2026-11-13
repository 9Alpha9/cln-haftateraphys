'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Dumbbell,
  FileText,
  Filter,
  HeartPulse,
  Stethoscope,
  Target,
  TrendingUp,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { MedicalRecordActions } from '@/components/dashboard/medical-record-actions';
import { PaginationBar } from '@/components/ui/pagination-bar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { PatientMedicalRecordSummary, TherapyProgressView } from '@/server/queries/therapy-progress';
import type { HomeProgramView } from '@/server/queries/home-programs';
import type { TreatmentPlanView } from '@/server/queries/treatment-plans';

type TabKey = 'medis' | 'riwayat' | 'diagnosis' | 'tindakan' | 'dokumen';

const TABS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: 'medis', label: 'Rekam Medis', icon: Activity },
  { key: 'riwayat', label: 'Riwayat Kunjungan', icon: CalendarDays },
  { key: 'diagnosis', label: 'Diagnosis', icon: Stethoscope },
  { key: 'tindakan', label: 'Tindakan', icon: ClipboardList },
  { key: 'dokumen', label: 'Dokumen & Cetak', icon: FileText },
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

function DateBadge({ date }: { date: Date }) {
  return (
    <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-full bg-[var(--hafta-org-50)] text-[#181700]">
      <span className="text-sm font-extrabold leading-none">{date.getDate()}</span>
      <span className="mt-0.5 text-[9px] font-semibold uppercase">
        {date.toLocaleDateString('id-ID', { month: 'short' })}
      </span>
    </span>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center px-4 sm:px-5 py-10 sm:py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--hafta-org-50)] text-[#181700]">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 text-sm font-bold text-[#181700]">{title}</h3>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-stone-500">{description}</p>
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

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="rounded-3xl border border-stone-200 bg-white p-3.5 sm:p-5">
        <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
          <div className="flex min-w-0 items-start gap-3.5 sm:items-center sm:gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--hafta-org-50)] text-lg font-bold text-[#181700] ring-1 ring-stone-200 sm:h-16 sm:w-16 sm:text-xl">
              {patient?.avatarKey ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={patient.avatarKey} alt="Foto profil" className="h-full w-full object-cover" />
              ) : (
                patient?.fullName?.[0]?.toUpperCase() ?? 'P'
              )}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-[#181700] sm:text-lg">
                {patient?.fullName ?? 'Pasien'}
              </h2>
              <p className="mt-0.5 truncate text-xs text-stone-500">
                No. RM {patient?.medicalRecordNumber ?? patient?.id?.slice(0, 10).toUpperCase() ?? '-'}
              </p>
              <span className="mt-2 inline-flex w-fit rounded-full bg-[var(--hafta-org-50)] px-2.5 py-0.5 text-[11px] font-semibold text-[#181700]">
                {patient?.caseStatus ? `Kasus: ${patient.caseStatus}` : 'Pasien aktif'}
              </span>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-2xl bg-[#FBFBFA] p-3.5 text-sm sm:ml-auto sm:shrink-0 sm:gap-x-8 sm:rounded-none sm:bg-transparent sm:p-0 sm:pl-8 sm:border-l sm:border-stone-100">
            <div>
              <dt className="text-[11px] text-stone-500">Usia</dt>
              <dd className="mt-0.5 font-bold text-[#181700]">{age !== null ? `${age} tahun` : '-'}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-stone-500">Total kunjungan</dt>
              <dd className="mt-0.5 font-bold text-[#181700]">{records.length} sesi</dd>
            </div>
            <div>
              <dt className="text-[11px] text-stone-500">Terapis</dt>
              <dd className="mt-0.5 max-w-40 truncate font-bold text-[#181700]">
                {patient?.therapistName ?? latestRecord?.therapistName ?? '-'}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-stone-500">Jadwal berikutnya</dt>
              <dd className="mt-0.5 font-bold text-[#181700]">
                {patient?.nextTherapyAt ? formatShortDate(patient.nextTherapyAt) : '-'}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {treatmentPlan ? (
        <section className="rounded-3xl border border-stone-200 bg-white p-3.5 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-stone-100 pb-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--hafta-org-50)] text-[#181700]">
                <Target className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-[#181700]">Rencana Terapi</h2>
                <p className="text-[11px] text-stone-500">
                  Tujuan dan intervensi yang disusun fisioterapis Anda
                </p>
              </div>
            </div>
            <span className="rounded-full border border-[var(--hafta-grn-200)] bg-[var(--hafta-grn-50)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--hafta-grn-700)]">
              Aktif
            </span>
          </div>

          <div className="mt-3 space-y-2.5 text-sm">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-stone-400">
                Tujuan
              </p>
              <p className="mt-1 whitespace-pre-wrap text-[#181700]">{treatmentPlan.goals}</p>
            </div>
            <div className="border-t border-stone-100 pt-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-stone-400">
                Intervensi
              </p>
              <p className="mt-1 whitespace-pre-wrap text-[#181700]">
                {treatmentPlan.interventions}
              </p>
            </div>
            {treatmentPlan.reviewIntervalText || treatmentPlan.reviewAt ? (
              <p className="border-t border-stone-100 pt-2.5 text-[11px] text-stone-500">
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
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                Perhatian: {treatmentPlan.precautions}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {homeProgram ? (
        <section className="rounded-3xl border border-stone-200 bg-white p-3.5 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-stone-100 pb-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--hafta-org-50)] text-[#181700]">
                <Dumbbell className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-[#181700]">Program Latihan Mandiri</h2>
                <p className="text-[11px] text-stone-500">
                  {homeProgram.startsAt
                    ? `Mulai ${formatShortDate(homeProgram.startsAt)}${
                        homeProgram.endsAt ? ` · sampai ${formatShortDate(homeProgram.endsAt)}` : ''
                      }`
                    : 'Latihan yang dianjurkan fisioterapis Anda'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[var(--hafta-grn-200)] bg-[var(--hafta-grn-50)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--hafta-grn-700)]">
                Aktif
              </span>
              <Link
                href="/dashboard/exercises"
                className="inline-flex h-8 items-center gap-1 rounded-full border border-stone-200 bg-white px-3 text-[10px] font-semibold text-[#181700] transition-colors hover:bg-stone-100"
              >
                Buka Latihan Saya
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <ul className="mt-3 space-y-2">
            {homeProgram.items.map((item, index) => (
              <li key={item.id} className="rounded-2xl bg-[#FBFBFA] p-3">
                <p className="text-xs font-bold text-[#181700]">
                  {index + 1}. {item.name}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-stone-600">
                  {item.instruction}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px] font-semibold text-stone-600">
                  {item.sets ? (
                    <span className="rounded-full bg-white px-2 py-0.5">{item.sets} set</span>
                  ) : null}
                  {item.repetitions ? (
                    <span className="rounded-full bg-white px-2 py-0.5">
                      {item.repetitions} repetisi
                    </span>
                  ) : null}
                  {item.durationSeconds ? (
                    <span className="rounded-full bg-white px-2 py-0.5">
                      {item.durationSeconds} detik
                    </span>
                  ) : null}
                  {item.frequencyText ? (
                    <span className="rounded-full bg-white px-2 py-0.5">{item.frequencyText}</span>
                  ) : null}
                </div>
                {item.precaution ? (
                  <p className="mt-1.5 text-[10px] text-amber-800">Perhatian: {item.precaution}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <nav
        aria-label="Bagian rekam medis"
        className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-3 py-2"
      >
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">
            Tampilan
          </p>
          <p className="truncate text-xs font-bold text-[#181700]">
            {TABS.find((tab) => tab.key === activeTab)?.label ?? 'Rekam Medis'}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 text-[11px] font-semibold text-[#181700] transition-colors hover:bg-stone-50">
            <Filter className="h-3.5 w-3.5" />
            Filter
            <ChevronDown className="h-3.5 w-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {TABS.map(({ key, label, icon: Icon }) => (
              <DropdownMenuItem
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn('my-0.5 gap-2', activeTab === key && 'bg-stone-100 font-semibold')}
              >
                <Icon className="h-4 w-4" />
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <main className="min-w-0">
          {records.length === 0 ? (
            <section className="rounded-3xl border border-stone-200 bg-white">
              <EmptyState
                icon={Activity}
                title="Belum ada rekam medis"
                description="Catatan evaluasi akan tampil setelah fisioterapis menyelesaikan sesi dan membagikannya untuk Anda."
              />
            </section>
          ) : activeTab === 'medis' && selectedRecord ? (
            <section className="rounded-3xl border border-stone-200 bg-white p-3.5 sm:p-5">
              <header className="flex items-center justify-between gap-4 border-b border-stone-200 pb-5">
                <div className="flex items-center gap-3.5">
                  <DateBadge date={selectedRecord.recordedAt} />
                  <div>
                    <h3 className="text-base font-bold text-[#181700]">Evaluasi Sesi Terapi</h3>
                    <p className="mt-0.5 text-xs text-stone-500">
                      {formatDate(selectedRecord.recordedAt)} · {selectedRecord.therapistName ?? 'Fisioterapis Hafta'}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0">
                  <MedicalRecordActions record={selectedRecord} />
                </div>
              </header>

              <div className="py-3.5 sm:py-5">
                <h4 className="text-xs font-semibold text-stone-500">Parameter fisik</h4>
                <dl className="mt-3 grid grid-cols-2 gap-3">
                  {[
                    { key: 'pain', label: 'Nyeri', score: selectedRecord.painScore, icon: HeartPulse },
                    {
                      key: 'rom',
                      label: 'Rentang gerak (ROM)',
                      score: selectedRecord.rangeOfMotionScore,
                      icon: Activity,
                    },
                    { key: 'strength', label: 'Kekuatan otot', score: selectedRecord.strengthScore, icon: TrendingUp },
                    { key: 'function', label: 'Fungsi fisik', score: selectedRecord.functionScore, icon: UserRound },
                  ].map(({ key, label, score, icon: Icon }) => {
                    const presentation = getMetricPresentation(key, Number(score));
                    const toneStyles: Record<MetricTone, { badge: string; bar: string }> = {
                      optimal: {
                        badge: 'bg-[var(--hafta-grn-50)] text-[var(--hafta-grn-700)]',
                        bar: 'bg-[var(--hafta-grn-500)]',
                      },
                      good: {
                        badge: 'bg-[var(--hafta-org-50)] text-[var(--hafta-org-900)]',
                        bar: 'bg-[var(--hafta-org-200)]',
                      },
                      attention: {
                        badge: 'bg-[var(--hafta-red-50)] text-[var(--hafta-red-700)]',
                        bar: 'bg-[var(--hafta-red-500)]',
                      },
                    };
                    return (
                      <div key={key} className="min-w-0 rounded-2xl border border-stone-200/90 bg-[#FAFAF8] p-3 sm:p-4">
                        <div className="flex items-start justify-between gap-2">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#181700] ring-1 ring-stone-200">
                            <Icon className="h-4 w-4" />
                          </span>
                          <span
                            className={cn(
                              'rounded-full px-2 py-1 text-[9px] font-bold leading-none',
                              toneStyles[presentation.tone].badge,
                            )}
                          >
                            {presentation.label}
                          </span>
                        </div>
                        <dt className="mt-3 text-[11px] font-medium leading-tight text-stone-500">{label}</dt>
                        <dd className="mt-1 flex items-baseline gap-0.5 text-[#181700]">
                          <span className="font-mono text-2xl font-extrabold leading-none">{score}</span>
                          <span className="text-[11px] font-medium text-stone-400">/10</span>
                        </dd>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-200/80">
                          <div
                            className={cn('h-full rounded-full', toneStyles[presentation.tone].bar)}
                            style={{ width: `${presentation.percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </dl>
              </div>

              <div className="border-t border-stone-200 pt-5">
                <h4 className="text-xs font-semibold text-stone-500">Catatan klinis</h4>
                <dl className="mt-2 divide-y divide-stone-100">
                  {CLINICAL_SECTIONS.map(({ label, field }) => {
                    const value = selectedRecord[field];
                    return (
                      <div key={field} className="grid gap-1 py-3.5 sm:grid-cols-[14rem_minmax(0,1fr)] sm:gap-5">
                        <dt className="text-xs font-medium text-stone-500">{label}</dt>
                        <dd className="whitespace-pre-wrap text-sm leading-relaxed text-[#181700]">
                          {typeof value === 'string' && value ? value : <span className="text-stone-400">Tidak dicatat</span>}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </div>

              {records.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('riwayat')}
                  className="mt-4 inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-stone-200 bg-white text-xs font-semibold text-[#181700] transition-colors hover:bg-[var(--hafta-org-50)]/50"
                >
                  <CalendarDays className="h-4 w-4" />
                  Lihat riwayat lengkap ({records.length} kunjungan)
                </button>
              ) : null}
            </section>
          ) : activeTab === 'riwayat' ? (
            <section className="rounded-3xl border border-stone-200 bg-white p-3.5 sm:p-5">
              <div className="flex items-start justify-between gap-3 border-b border-stone-200 pb-4">
                <div>
                  <h3 className="text-base font-bold text-[#181700]">Riwayat Kunjungan</h3>
                  <p className="mt-1 text-xs text-stone-500">Pilih kunjungan untuk membuka detail rekam medis.</p>
                </div>
                <span className="shrink-0 rounded-full bg-[var(--hafta-org-50)] px-3 py-1 text-[11px] font-semibold text-[#181700]">
                  {records.length} sesi
                </span>
              </div>
              <div className="divide-y divide-stone-100">
                {visibleVisits.map((record) => (
                  <button
                    key={record.id}
                    type="button"
                    onClick={() => openRecord(record.id)}
                    className="group flex w-full cursor-pointer items-center gap-3.5 py-4 text-left"
                  >
                    <DateBadge date={record.recordedAt} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-[#181700]">Kunjungan Ke-{visitNumberById.get(record.id) ?? 0}</span>
                      <span className="mt-0.5 block truncate text-xs text-stone-500">
                        {record.therapistName ?? 'Fisioterapis Hafta'} · {formatShortDate(record.recordedAt)}
                      </span>
                      <span className="mt-1 flex flex-wrap gap-3 text-[11px] text-stone-500">
                        <span>Nyeri {record.painScore}/10</span>
                        <span>Fungsi {record.functionScore}/10</span>
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-stone-300 transition-transform group-hover:translate-x-0.5" />
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
            </section>
          ) : activeTab === 'diagnosis' ? (
            <section className="rounded-3xl border border-stone-200 bg-white p-3.5 sm:p-5">
              <h3 className="text-base font-bold text-[#181700]">Diagnosis & Anamnesis</h3>
              <p className="mt-1 text-xs text-stone-500">Ringkasan diagnosis dari setiap evaluasi fisioterapis.</p>
              <div className="mt-2 divide-y divide-stone-100">
                {records.map((record) => (
                  <article key={record.id} className="py-4">
                    <div className="flex items-center gap-3">
                      <DateBadge date={record.recordedAt} />
                      <div>
                        <p className="text-sm font-bold text-[#181700]">Evaluasi Kunjungan Ke-{visitNumberById.get(record.id) ?? 0}</p>
                        <p className="text-xs text-stone-500">{record.therapistName ?? 'Fisioterapis Hafta'}</p>
                      </div>
                    </div>
                    <dl className="mt-3 space-y-3">
                      <div>
                        <dt className="text-[11px] font-semibold text-stone-500">Diagnosis fisioterapi</dt>
                        <dd className="mt-1 text-sm leading-relaxed text-[#181700]">{record.diagnosis || 'Tidak dicatat'}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold text-stone-500">Anamnesis</dt>
                        <dd className="mt-1 text-sm leading-relaxed text-[#181700]">{record.anamnesis || 'Tidak dicatat'}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            </section>
          ) : activeTab === 'tindakan' ? (
            <section className="rounded-3xl border border-stone-200 bg-white p-3.5 sm:p-5">
              <h3 className="text-base font-bold text-[#181700]">Tindakan Terapi</h3>
              <p className="mt-1 text-xs text-stone-500">Pemeriksaan dan tindakan yang dilakukan pada setiap sesi.</p>
              <div className="mt-2 divide-y divide-stone-100">
                {records.map((record) => (
                  <article key={record.id} className="py-4">
                    <div className="flex items-center gap-3">
                      <DateBadge date={record.recordedAt} />
                      <div>
                        <p className="text-sm font-bold text-[#181700]">Kunjungan Ke-{visitNumberById.get(record.id) ?? 0}</p>
                        <p className="text-xs text-stone-500">{record.therapistName ?? 'Fisioterapis Hafta'}</p>
                      </div>
                    </div>
                    <dl className="mt-3 space-y-3">
                      <div>
                        <dt className="text-[11px] font-semibold text-stone-500">Pemeriksaan fisik & penunjang</dt>
                        <dd className="mt-1 text-sm leading-relaxed text-[#181700]">{record.physicalExamination || 'Tidak dicatat'}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold text-stone-500">Tindakan yang diberikan</dt>
                        <dd className="mt-1 text-sm leading-relaxed text-[#181700]">{record.treatment || 'Tidak dicatat'}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            </section>
          ) : (
            <section className="rounded-3xl border border-stone-200 bg-white p-3.5 sm:p-5">
              <h3 className="text-base font-bold text-[#181700]">Dokumen & Cetak</h3>
              <p className="mt-1 text-xs text-stone-500">Unduh atau cetak ringkasan rekam medis yang telah dibagikan.</p>
              <div className="mt-2 divide-y divide-stone-100">
                {records.map((record) => (
                  <div key={record.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--hafta-org-50)] text-[#181700]">
                        <FileText className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#181700]">Rekam Medis Kunjungan Ke-{visitNumberById.get(record.id) ?? 0}</p>
                        <p className="mt-0.5 text-xs text-stone-500">
                          {record.therapistName ?? 'Fisioterapis Hafta'} · dokumen resmi
                        </p>
                      </div>
                    </div>
                    <MedicalRecordActions record={record} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>

        <aside className="space-y-4 xl:sticky xl:top-[88px] xl:self-start">
          <section className="rounded-3xl border border-stone-200 bg-white p-3.5 sm:p-5">
            <h2 className="text-sm font-bold text-[#181700]">Ringkasan Terapi</h2>
            <dl className="mt-3 divide-y divide-stone-100 text-sm">
              <SummaryRow label="Status kasus" value={patient?.caseStatus ?? 'Aktif'} />
              <SummaryRow label="Mulai terapi" value={firstRecord ? formatShortDate(firstRecord.recordedAt) : '-'} />
              <SummaryRow label="Kunjungan" value={`${records.length} sesi`} />
              <SummaryRow label="Progres rata-rata" value={`${averageProgress}%`} />
            </dl>
            <div className="mt-4 border-t border-stone-100 pt-4">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold text-stone-500">
                <Target className="h-3.5 w-3.5 text-[#181700]" />
                Target terapi
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#181700]">
                {patient?.therapyGoal ?? latestRecord?.followUpPlan ?? 'Belum ditentukan.'}
              </p>
            </div>
            <div className="mt-4 border-t border-stone-100 pt-4">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold text-stone-500">
                <Stethoscope className="h-3.5 w-3.5 text-[#181700]" />
                Diagnosis terkini
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#181700]">
                {latestRecord?.diagnosis ?? patient?.therapyDiagnosisLabel ?? 'Belum tersedia.'}
              </p>
            </div>
          </section>

          {patient?.therapistNote ? (
            <section className="rounded-3xl bg-[var(--hafta-org-50)]/55 p-3.5 sm:p-5">
              <h2 className="text-sm font-bold text-[#181700]">Catatan fisioterapis</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#181700]">{patient.therapistNote}</p>
              <p className="mt-3 text-[11px] text-stone-500">
                {patient.therapistNoteAuthor ?? patient.therapistName ?? 'Fisioterapis Hafta'}
                {patient.therapistNoteAt ? ` · ${formatShortDate(patient.therapistNoteAt)}` : ''}
              </p>
            </section>
          ) : null}

          <section className="rounded-3xl border border-stone-200 bg-white p-3.5 sm:p-5">
            <h2 className="text-sm font-bold text-[#181700]">Tim Terapi</h2>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--hafta-org-50)] text-[#181700]">
                <UserRound className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-bold text-[#181700]">
                  {patient?.therapistName ?? latestRecord?.therapistName ?? 'Fisioterapis Hafta'}
                </p>
                <p className="text-xs text-stone-500">Fisioterapis pendamping</p>
              </div>
            </div>
            {patient?.therapyFrequencyText ? (
              <p className="mt-3 border-t border-stone-100 pt-3 text-xs leading-relaxed text-stone-500">
                Frekuensi terapi: {patient.therapyFrequencyText}
              </p>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="text-xs text-stone-500">{label}</dt>
      <dd className="text-right text-xs font-bold text-[#181700]">{value}</dd>
    </div>
  );
}
