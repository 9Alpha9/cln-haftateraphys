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
  MapPin,
  Phone,
  Mail,
  Stethoscope,
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

const shortDate = (value: Date) =>
  value.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

const longDate = (value: Date) =>
  value.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const monthShort = (value: Date) => value.toLocaleDateString('id-ID', { month: 'short' });

const numericDate = (value: Date) => value.toLocaleDateString('id-ID');

type MetricTone = 'optimal' | 'good' | 'attention';

function getMetricPresentation(key: string, score: number): { percentage: number; label: string; tone: MetricTone } {
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

const TONE_BAR: Record<MetricTone, string> = {
  optimal: 'bg-[var(--hafta-grn-400)]',
  good: 'bg-[var(--hafta-300)]',
  attention: 'bg-[var(--hafta-red-400)]',
};

const TONE_TEXT: Record<MetricTone, string> = {
  optimal: 'text-[var(--hafta-grn-300)]',
  good: 'text-[var(--hafta-300)]',
  attention: 'text-[var(--hafta-red-400)]',
};

const TONE_CHIP: Record<MetricTone, string> = {
  optimal: 'bg-[var(--hafta-grn-500)]/15 text-[var(--hafta-grn-300)]',
  good: 'bg-[var(--hafta-300)]/15 text-[var(--hafta-300)]',
  attention: 'bg-[var(--hafta-red-500)]/15 text-[var(--hafta-red-300)]',
};

function Panel({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-white/10 bg-[#191817] sm:rounded-3xl',
        className,
      )}
    >
      {title ? (
        <header className="flex items-start justify-between gap-2 px-3.5 pt-3.5 sm:px-5 sm:pt-5">
          <div className="min-w-0">
            <h2 className="truncate text-[13px] font-semibold tracking-tight text-[#F7F3EC] sm:text-sm">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-white/45 sm:text-[11px]">
                {subtitle}
              </p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      <div className={cn('p-3.5 sm:p-5', title && 'pt-2.5 sm:pt-3', bodyClassName)}>{children}</div>
    </section>
  );
}

function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-white/70',
        className,
      )}
    >
      {children}
    </span>
  );
}

function MiniDot({ tone = 'good' }: { tone?: MetricTone }) {
  return <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', TONE_BAR[tone])} />;
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
  const visibleVisits = records.slice((safeVisitPage - 1) * visitsPerPage, safeVisitPage * visitsPerPage);
  const chronological = useMemo(
    () => [...records].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()),
    [records],
  );
  const visitNumberById = useMemo(
    () => new Map(chronological.map((record, index) => [record.id, index + 1])),
    [chronological],
  );
  const trend = useMemo(() => chronological.slice(-8), [chronological]);
  const recentDiagnoses = useMemo(() => records.filter((record) => Boolean(record.diagnosis)).slice(0, 3), [records]);
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
  const conditionChips = Array.from(
    new Set(records.map((record) => record.diagnosis).filter((value): value is string => Boolean(value))),
  ).slice(0, 4);

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
    <div className="rounded-3xl bg-[#0E0D0C] p-2.5 text-[#F7F3EC] sm:p-4 lg:p-5">
      {/* top bar */}
      <div className="flex items-center justify-between gap-3 px-1 pb-3 sm:pb-4">
        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/35">Portal Pasien</p>
          <h1 className="mt-0.5 truncate text-base font-bold tracking-tight sm:text-lg">Rekam Medis Saya</h1>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold text-white/70">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--hafta-300)]" />
          {records.length} sesi
        </span>
      </div>

      <div className="grid gap-2.5 sm:gap-3 lg:grid-cols-[19rem_minmax(0,1fr)]">
        {/* ── LEFT: PROFIL ── */}
        <div className="space-y-2.5 sm:space-y-3">
          <Panel bodyClassName="p-3.5 sm:p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 text-lg font-bold text-[#F7F3EC] ring-1 ring-white/15">
                {patient?.avatarKey ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={patient.avatarKey} alt="Foto profil" className="h-full w-full object-cover" />
                ) : (
                  (patient?.preferredName ?? patient?.fullName)?.[0]?.toUpperCase() ?? 'P'
                )}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-[15px] font-bold leading-tight sm:text-base">
                  {patient?.preferredName ?? patient?.fullName ?? 'Pasien'}
                </h2>
                <p className="mt-0.5 truncate text-[10px] text-white/45">
                  RM {patient?.medicalRecordNumber ?? patient?.id?.slice(0, 8).toUpperCase() ?? '-'}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  <Chip className="border-[var(--hafta-300)]/30 bg-[var(--hafta-300)]/10 text-[var(--hafta-300)]">
                    {patient?.caseStatus ?? 'Aktif'}
                  </Chip>
                  {age !== null ? <Chip>{age} th</Chip> : null}
                  {patient?.gender ? <Chip>{patient.gender}</Chip> : null}
                </div>
              </div>
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
              {[
                { label: 'Terapis', value: patient?.therapistName ?? latestRecord?.therapistName ?? '-' },
                { label: 'Frekuensi', value: patient?.therapyFrequencyText ?? '-' },
                { label: 'Mulai', value: firstRecord ? shortDate(firstRecord.recordedAt) : '-' },
                { label: 'Berikutnya', value: patient?.nextTherapyAt ? shortDate(patient.nextTherapyAt) : '-' },
              ].map((row) => (
                <div key={row.label} className="min-w-0 rounded-xl bg-white/[0.03] px-2 py-1.5">
                  <dt className="text-[8.5px] font-semibold uppercase tracking-wider text-white/35">
                    {row.label}
                  </dt>
                  <dd className="mt-0.5 truncate text-[10.5px] font-semibold text-white/85">{row.value}</dd>
                </div>
              ))}
            </dl>
          </Panel>

          <Panel title="Informasi Umum">
            <dl className="space-y-1.5 text-[11px]">
              <Row label="Tanggal lahir" value={patient?.dateOfBirth ? numericDate(patient.dateOfBirth) : '-'} />
              <Row label="Usia" value={age !== null ? `${age} tahun` : '-'} />
              <Row label="Pekerjaan" value={patient?.occupation ?? '-'} />
              <Row label="Kota" value={patient?.addressCity ?? patient?.addressProvince ?? '-'} />
            </dl>
            <div className="mt-2.5 space-y-1 border-t border-white/10 pt-2.5 text-[10.5px] text-white/55">
              <p className="flex items-center gap-1.5 truncate">
                <Mail className="h-3 w-3 shrink-0 text-white/35" />
                {patient?.email ?? '-'}
              </p>
              <p className="flex items-center gap-1.5 truncate">
                <Phone className="h-3 w-3 shrink-0 text-white/35" />
                {patient?.phone ?? '-'}
              </p>
              <p className="flex items-start gap-1.5">
                <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-white/35" />
                <span className="line-clamp-2">{patient?.addressLine ?? '-'}</span>
              </p>
            </div>
          </Panel>

          <Panel title="Kondisi Aktif">
            {conditionChips.length === 0 ? (
              <p className="text-[11px] text-white/45">Belum ada diagnosis tercatat.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {conditionChips.map((condition) => (
                  <span
                    key={condition}
                    className="inline-flex max-w-full items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-medium text-white/75"
                  >
                    <Stethoscope className="h-3 w-3 shrink-0 text-[var(--hafta-300)]" />
                    <span className="truncate">{condition}</span>
                  </span>
                ))}
              </div>
            )}
            {latestRecord?.diagnosis ? (
              <p className="mt-2 border-t border-white/10 pt-2 text-[10px] leading-relaxed text-white/45">
                Terakhir: {latestRecord.diagnosis}
              </p>
            ) : null}
          </Panel>

          <Panel title="Target Terapi">
            <p className="text-[11px] leading-relaxed text-white/70">
              {patient?.therapyGoal ?? latestRecord?.followUpPlan ?? 'Belum ditentukan.'}
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[var(--hafta-300)]"
                  style={{ width: `${Math.min(100, Math.max(4, averageProgress))}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-[var(--hafta-300)]">{averageProgress}%</span>
            </div>
          </Panel>

          <Panel title="Tim Terapi">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white/70">
                <UserRound className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold text-white/85">
                  {patient?.therapistName ?? latestRecord?.therapistName ?? 'Fisioterapis Hafta'}
                </p>
                <p className="text-[9.5px] text-white/35">Fisioterapis pendamping</p>
              </div>
            </div>
            {patient?.therapyFrequencyText ? (
              <p className="mt-2 border-t border-white/10 pt-2 text-[9.5px] leading-relaxed text-white/40">
                Frekuensi: {patient.therapyFrequencyText}
              </p>
            ) : null}
          </Panel>

          {patient?.emergencyContactName ? (
            <Panel title="Kontak Darurat">
              <dl className="space-y-1.5 text-[11px]">
                <Row label="Nama" value={patient.emergencyContactName} />
                <Row label="Hubungan" value={patient.emergencyContactRelationship ?? '-'} />
                <Row label="Telepon" value={patient.emergencyContactPhone ?? '-'} />
              </dl>
            </Panel>
          ) : null}
        </div>

        {/* ── RIGHT: KONTEN ── */}
        <div className="min-w-0 space-y-2.5 sm:space-y-3">
          {/* chart */}
          <Panel
            title="Perkembangan Terapi"
            subtitle="Skor fungsi per sesi"
            action={
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[9px] font-semibold text-white/50">
                {trend.length} sesi terakhir
              </span>
            }
          >
            {trend.length === 0 ? (
              <p className="py-6 text-center text-[11px] text-white/40">Belum ada data perkembangan.</p>
            ) : (
              <>
                <div className="flex h-28 items-end gap-1.5 sm:h-32 sm:gap-2">
                  {trend.map((record, index) => {
                    const height = Math.max(8, Math.min(100, Number(record.functionScore) * 10));
                    const isLast = index === trend.length - 1;
                    return (
                      <button
                        key={record.id}
                        type="button"
                        onClick={() => openRecord(record.id)}
                        title={`${shortDate(record.recordedAt)} · Fungsi ${record.functionScore}/10`}
                        className="group flex h-full flex-1 cursor-pointer flex-col justify-end gap-1"
                      >
                        <span className="text-center text-[8px] font-semibold text-white/40 group-hover:text-white/70">
                          {record.functionScore}
                        </span>
                        <span
                          className={cn(
                            'w-full rounded-t-md transition-colors',
                            isLast ? 'bg-[var(--hafta-300)]' : 'bg-white/15 group-hover:bg-white/25',
                          )}
                          style={{ height: `${height}%` }}
                        />
                        <span className="truncate text-center text-[8px] uppercase tracking-wide text-white/35">
                          {monthShort(record.recordedAt)}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2.5 grid grid-cols-3 gap-1.5 border-t border-white/10 pt-2.5 sm:grid-cols-4">
                  {[
                    { label: 'Nyeri', value: latestRecord?.painScore, tone: getMetricPresentation('pain', Number(latestRecord?.painScore ?? 0)).tone },
                    { label: 'ROM', value: latestRecord?.rangeOfMotionScore, tone: getMetricPresentation('rom', Number(latestRecord?.rangeOfMotionScore ?? 0)).tone },
                    { label: 'Kekuatan', value: latestRecord?.strengthScore, tone: getMetricPresentation('strength', Number(latestRecord?.strengthScore ?? 0)).tone },
                    { label: 'Fungsi', value: latestRecord?.functionScore, tone: getMetricPresentation('function', Number(latestRecord?.functionScore ?? 0)).tone },
                  ].map((metric) => (
                    <div key={metric.label} className="rounded-lg bg-white/[0.03] px-2 py-1.5">
                      <p className="text-[8.5px] uppercase tracking-wider text-white/35">{metric.label}</p>
                      <p className={cn('mt-0.5 font-mono text-sm font-bold', TONE_TEXT[metric.tone])}>
                        {metric.value ?? '-'}
                        <span className="text-[9px] text-white/30">/10</span>
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Panel>

          {/* quick tiles */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {quickTiles.map(({ key, label, hint, icon: Icon }) => {
              const isActive = key !== 'latihan' && activeTab === key;
              const cls = cn(
                'group flex min-h-[78px] w-full flex-col items-start justify-between rounded-2xl border p-2.5 text-left transition-colors sm:p-3',
                isActive
                  ? 'border-[var(--hafta-300)]/60 bg-[var(--hafta-300)]/10'
                  : 'border-white/10 bg-[#191817] hover:border-white/20 hover:bg-[#211F1D]',
              );
              const body = (
                <>
                  <span
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-lg',
                      isActive ? 'bg-[var(--hafta-300)] text-[#1A1200]' : 'bg-white/[0.06] text-white/70',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="mt-2 block w-full truncate text-[10.5px] font-semibold text-white/90">
                    {label}
                  </span>
                  <span className="block w-full truncate text-[9px] text-white/35">{hint}</span>
                </>
              );
              return key === 'latihan' ? (
                <Link key={key} href="/dashboard/exercises" className={cls}>
                  {body}
                </Link>
              ) : (
                <button key={key} type="button" onClick={() => setActiveTab(key)} className={cls}>
                  {body}
                </button>
              );
            })}
          </div>

          {/* diagnosis terkini */}
          <Panel
            title="Diagnosis Terkini"
            action={
              records.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('diagnosis')}
                  className="text-[10px] font-semibold text-white/40 transition-colors hover:text-[var(--hafta-300)]"
                >
                  Lihat semua
                </button>
              ) : null
            }
          >
            {recentDiagnoses.length === 0 ? (
              <p className="text-[11px] text-white/45">
                {latestRecord?.diagnosis ?? patient?.therapyDiagnosisLabel ?? 'Belum tersedia.'}
              </p>
            ) : (
              <ul className="space-y-1.5">
                {recentDiagnoses.map((record) => (
                  <li key={record.id}>
                    <button
                      type="button"
                      onClick={() => openRecord(record.id)}
                      className="group flex w-full cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2 text-left transition-colors hover:bg-white/[0.06]"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--hafta-300)]/10 text-[var(--hafta-300)]">
                        <HeartPulse className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] font-semibold text-white/85">
                          {record.diagnosis}
                        </span>
                        <span className="block text-[9px] text-white/35">{shortDate(record.recordedAt)}</span>
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/25 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* timeline */}
          {chronological.length > 0 ? (
            <Panel
              title="Riwayat Perawatan"
              subtitle="Urutan sesi terapi"
              action={
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[9px] font-semibold text-white/50">
                  {records.length} sesi
                </span>
              }
            >
              <div className="relative">
                <span className="absolute left-0 right-0 top-[13px] h-px bg-white/10" aria-hidden="true" />
                <div className="relative flex snap-x snap-mandatory gap-1.5 overflow-x-auto pb-2 pr-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {chronological.map((record, index) => {
                    const isActive = record.id === selectedRecord?.id;
                    return (
                      <button
                        key={record.id}
                        type="button"
                        onClick={() => openRecord(record.id)}
                        aria-pressed={isActive}
                        className="group w-[92px] shrink-0 snap-start text-left"
                      >
                        <span className="flex items-center">
                          <span
                            className={cn(
                              'flex h-6 w-6 items-center justify-center rounded-full border text-[8.5px] font-bold transition-colors',
                              isActive
                                ? 'border-[var(--hafta-300)] bg-[var(--hafta-300)] text-[#1A1200]'
                                : 'border-white/15 bg-[#191817] text-white/50 group-hover:border-white/30 group-hover:text-white/80',
                            )}
                          >
                            {index + 1}
                          </span>
                          <span className="ml-1 h-px flex-1 bg-white/10" aria-hidden="true" />
                        </span>
                        <span className="mt-1.5 block truncate text-[9.5px] font-semibold text-white/70">
                          {shortDate(record.recordedAt)}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1 text-[8.5px] text-white/35">
                          <MiniDot tone={getMetricPresentation('function', record.functionScore).tone} />
                          Fungsi {record.functionScore}/10
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </Panel>
          ) : null}

          {/* tabs */}
          <div className="flex gap-1 overflow-x-auto rounded-full border border-white/10 bg-[#191817] p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                aria-pressed={activeTab === key}
                className={cn(
                  'inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-[10.5px] font-semibold transition-colors',
                  activeTab === key
                    ? 'bg-[var(--hafta-300)] text-[#1A1200]'
                    : 'text-white/50 hover:bg-white/[0.06] hover:text-white/80',
                )}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}
          </div>

          {/* tab content */}
          <div className="space-y-2.5 sm:space-y-3">
            {records.length === 0 ? (
              <Panel>
                <div className="flex flex-col items-center px-4 py-8 text-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-white/60">
                    <Activity className="h-4 w-4" />
                  </span>
                  <h3 className="mt-2.5 text-xs font-semibold text-white/85">Belum ada rekam medis</h3>
                  <p className="mt-1 max-w-xs text-[10.5px] leading-relaxed text-white/40">
                    Catatan evaluasi akan tampil setelah fisioterapis menyelesaikan sesi dan membagikannya.
                  </p>
                </div>
              </Panel>
            ) : activeTab === 'medis' && selectedRecord ? (
              <>
                <Panel
                  title="Evaluasi Sesi"
                  subtitle={`${longDate(selectedRecord.recordedAt)} · ${selectedRecord.therapistName ?? 'Fisioterapis Hafta'}`}
                  action={
                    <span className="rounded-full bg-[var(--hafta-300)]/15 px-2 py-0.5 text-[9px] font-bold text-[var(--hafta-300)]">
                      Sesi {visitNumberById.get(selectedRecord.id) ?? 1}
                    </span>
                  }
                >
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                    {[
                      { key: 'pain', label: 'Nyeri', score: selectedRecord.painScore, icon: HeartPulse },
                      { key: 'rom', label: 'ROM', score: selectedRecord.rangeOfMotionScore, icon: Activity },
                      { key: 'strength', label: 'Kekuatan', score: selectedRecord.strengthScore, icon: TrendingUp },
                      { key: 'function', label: 'Fungsi', score: selectedRecord.functionScore, icon: UserRound },
                    ].map(({ key, label, score, icon: Icon }) => {
                      const presentation = getMetricPresentation(key, Number(score));
                      return (
                        <div key={key} className="rounded-xl border border-white/10 bg-white/[0.03] p-2">
                          <div className="flex items-center justify-between gap-1">
                            <span className="flex items-center gap-1 text-[9px] font-medium text-white/45">
                              <Icon className="h-3 w-3" />
                              {label}
                            </span>
                            <span
                              className={cn(
                                'rounded-full px-1.5 py-px text-[8px] font-bold',
                                TONE_CHIP[presentation.tone],
                              )}
                            >
                              {presentation.label}
                            </span>
                          </div>
                          <p className={cn('mt-1 font-mono text-lg font-bold leading-none', TONE_TEXT[presentation.tone])}>
                            {score}
                            <span className="text-[9px] text-white/30">/10</span>
                          </p>
                          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                            <div
                              className={cn('h-full rounded-full', TONE_BAR[presentation.tone])}
                              style={{ width: `${presentation.percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <dl className="mt-3 space-y-2">
                    {CLINICAL_SECTIONS.map(({ label, field }) => {
                      const value = selectedRecord[field];
                      return (
                        <div key={field} className="rounded-xl bg-white/[0.03] p-2.5">
                          <dt className="text-[9px] font-semibold uppercase tracking-wider text-white/35">
                            {label}
                          </dt>
                          <dd className="mt-1 whitespace-pre-wrap text-[11px] leading-relaxed text-white/80">
                            {typeof value === 'string' && value ? value : <span className="text-white/25">Tidak dicatat</span>}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>

                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('riwayat')}
                      className="inline-flex h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] text-[10.5px] font-semibold text-white/70 transition-colors hover:bg-white/[0.08]"
                    >
                      <CalendarDays className="h-3.5 w-3.5" />
                      Semua kunjungan
                    </button>
                    <MedicalRecordActions record={selectedRecord} tone="dark" />
                  </div>
                </Panel>
              </>
            ) : activeTab === 'riwayat' ? (
              <Panel
                title="Riwayat Kunjungan"
                subtitle="Pilih kunjungan untuk membuka detail"
                action={
                  <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[9px] font-bold text-white/60">
                    {records.length} sesi
                  </span>
                }
              >
                <div className="divide-y divide-white/10">
                  {visibleVisits.map((record) => (
                    <button
                      key={record.id}
                      type="button"
                      onClick={() => openRecord(record.id)}
                      className="group flex w-full cursor-pointer items-center gap-2.5 py-2.5 text-left"
                    >
                      <span className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                        <span className="text-[11px] font-bold leading-none text-white/85">
                          {record.recordedAt.getDate()}
                        </span>
                        <span className="mt-0.5 text-[7.5px] uppercase text-white/35">
                          {monthShort(record.recordedAt)}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] font-semibold text-white/85">
                          Kunjungan ke-{visitNumberById.get(record.id) ?? 0}
                        </span>
                        <span className="mt-0.5 block truncate text-[9.5px] text-white/35">
                          {record.therapistName ?? 'Fisioterapis Hafta'} · {shortDate(record.recordedAt)}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] text-white/40">
                          <span>Nyeri {record.painScore}/10</span>
                          <span>Fungsi {record.functionScore}/10</span>
                          <span
                            className={cn(
                              'rounded-full px-1.5 py-px text-[8px] font-bold',
                              record.status === 'FINALIZED'
                                ? 'bg-[var(--hafta-grn-500)]/15 text-[var(--hafta-grn-300)]'
                                : 'bg-[var(--hafta-300)]/15 text-[var(--hafta-300)]',
                            )}
                          >
                            {record.status === 'FINALIZED' ? 'Final' : 'Draft'}
                          </span>
                        </span>
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/25 transition-transform group-hover:translate-x-0.5" />
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
              </Panel>
            ) : activeTab === 'diagnosis' ? (
              <Panel title="Diagnosis & Anamnesis" subtitle="Ringkasan diagnosis tiap evaluasi">
                <div className="space-y-2">
                  {records.map((record) => (
                    <article key={record.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[10.5px] font-semibold text-white/80">
                          Kunjungan ke-{visitNumberById.get(record.id) ?? 0}
                        </p>
                        <span className="shrink-0 text-[9px] text-white/35">{shortDate(record.recordedAt)}</span>
                      </div>
                      <p className="mt-1.5 text-[11px] leading-relaxed text-white/70">
                        <span className="text-white/35">Diagnosis: </span>
                        {record.diagnosis || 'Tidak dicatat'}
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-white/70">
                        <span className="text-white/35">Anamnesis: </span>
                        {record.anamnesis || 'Tidak dicatat'}
                      </p>
                    </article>
                  ))}
                </div>
              </Panel>
            ) : activeTab === 'tindakan' ? (
              <Panel title="Tindakan Terapi" subtitle="Pemeriksaan dan tindakan per sesi">
                <div className="space-y-2">
                  {records.map((record) => (
                    <article key={record.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[10.5px] font-semibold text-white/80">
                          Kunjungan ke-{visitNumberById.get(record.id) ?? 0}
                        </p>
                        <span className="shrink-0 text-[9px] text-white/35">{shortDate(record.recordedAt)}</span>
                      </div>
                      <p className="mt-1.5 text-[11px] leading-relaxed text-white/70">
                        <span className="text-white/35">Pemeriksaan: </span>
                        {record.physicalExamination || 'Tidak dicatat'}
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-white/70">
                        <span className="text-white/35">Tindakan: </span>
                        {record.treatment || 'Tidak dicatat'}
                      </p>
                    </article>
                  ))}
                </div>
              </Panel>
            ) : (
              <Panel title="Dokumen & Cetak" subtitle="Unduh atau cetak rekam medis resmi">
                <div className="divide-y divide-white/10">
                  {records.map((record) => (
                    <div key={record.id} className="flex items-center gap-2.5 py-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-white/60">
                        <FileText className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[10.5px] font-semibold text-white/85">
                          Rekam Medis Kunjungan ke-{visitNumberById.get(record.id) ?? 0}
                        </p>
                        <p className="truncate text-[9px] text-white/35">
                          {record.therapistName ?? 'Fisioterapis Hafta'} · {shortDate(record.recordedAt)}
                        </p>
                      </div>
                      <MedicalRecordActions record={record} tone="dark" />
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {treatmentPlan ? (
              <Panel
                title="Rencana Terapi"
                action={
                  <span className="rounded-full bg-[var(--hafta-grn-500)]/15 px-2 py-0.5 text-[9px] font-bold text-[var(--hafta-grn-300)]">
                    Aktif
                  </span>
                }
              >
                <dl className="space-y-2 text-[11px]">
                  <div>
                    <dt className="text-[9px] font-semibold uppercase tracking-wider text-white/35">Tujuan</dt>
                    <dd className="mt-0.5 whitespace-pre-wrap leading-relaxed text-white/75">{treatmentPlan.goals}</dd>
                  </div>
                  <div className="border-t border-white/10 pt-2">
                    <dt className="text-[9px] font-semibold uppercase tracking-wider text-white/35">Intervensi</dt>
                    <dd className="mt-0.5 whitespace-pre-wrap leading-relaxed text-white/75">
                      {treatmentPlan.interventions}
                    </dd>
                  </div>
                  {treatmentPlan.precautions ? (
                    <p className="rounded-lg bg-[var(--hafta-red-500)]/10 px-2.5 py-1.5 text-[10px] text-[var(--hafta-red-300)]">
                      Perhatian: {treatmentPlan.precautions}
                    </p>
                  ) : null}
                </dl>
              </Panel>
            ) : null}

            {homeProgram ? (
              <Panel
                title="Program Latihan Mandiri"
                subtitle={
                  homeProgram.startsAt
                    ? `Mulai ${shortDate(homeProgram.startsAt)}${homeProgram.endsAt ? ` · sampai ${shortDate(homeProgram.endsAt)}` : ''}`
                    : 'Latihan anjuran fisioterapis'
                }
                action={
                  <Link
                    href="/dashboard/exercises"
                    className="inline-flex h-7 items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 text-[9.5px] font-semibold text-white/70 transition-colors hover:bg-white/[0.08]"
                  >
                    Buka
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                }
              >
                <ul className="space-y-1.5">
                  {homeProgram.items.map((item, index) => (
                    <li key={item.id} className="rounded-xl bg-white/[0.03] p-2.5">
                      <p className="text-[10.5px] font-semibold text-white/85">
                        {index + 1}. {item.name}
                      </p>
                      <p className="mt-0.5 whitespace-pre-wrap text-[10.5px] leading-relaxed text-white/50">
                        {item.instruction}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1 text-[8.5px] font-semibold text-white/60">
                        {item.sets ? <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5">{item.sets} set</span> : null}
                        {item.repetitions ? (
                          <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5">{item.repetitions} rep</span>
                        ) : null}
                        {item.durationSeconds ? (
                          <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5">{item.durationSeconds} dtk</span>
                        ) : null}
                        {item.frequencyText ? (
                          <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5">{item.frequencyText}</span>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </Panel>
            ) : null}

            {patient?.therapistNote ? (
              <Panel title="Catatan Fisioterapis">
                <p className="text-[11px] leading-relaxed text-white/70">{patient.therapistNote}</p>
                <p className="mt-2 text-[9.5px] text-white/35">
                  {patient.therapistNoteAuthor ?? patient.therapistName ?? 'Fisioterapis Hafta'}
                  {patient.therapistNoteAt ? ` · ${shortDate(patient.therapistNoteAt)}` : ''}
                </p>
              </Panel>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-white/35">{label}</dt>
      <dd className="truncate font-medium text-white/80">{value}</dd>
    </div>
  );
}
