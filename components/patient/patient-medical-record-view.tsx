'use client';

import { useMemo, useState } from 'react';
import {
  Activity,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileText,
  HeartPulse,
  Stethoscope,
  Target,
  TrendingUp,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { MedicalRecordActions } from '@/components/dashboard/medical-record-actions';
import { cn } from '@/lib/utils';
import type { PatientMedicalRecordSummary, TherapyProgressView } from '@/server/queries/therapy-progress';

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
    <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-full bg-[var(--hafta-ylw-50)] text-[#181700]">
      <span className="text-sm font-extrabold leading-none">{date.getDate()}</span>
      <span className="mt-0.5 text-[9px] font-semibold uppercase">
        {date.toLocaleDateString('id-ID', { month: 'short' })}
      </span>
    </span>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center px-5 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--hafta-ylw-50)] text-[#181700]">
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
}: {
  patient: PatientMedicalRecordSummary | null;
  records: TherapyProgressView[];
}) {
  const [activeTab, setActiveTab] = useState<TabKey>('medis');
  const [selectedRecordId, setSelectedRecordId] = useState(records[0]?.id ?? '');
  const [showAllVisits, setShowAllVisits] = useState(false);

  const latestRecord = records[0] ?? null;
  const selectedRecord = useMemo(
    () => records.find((record) => record.id === selectedRecordId) ?? latestRecord,
    [latestRecord, records, selectedRecordId],
  );
  const firstRecord = records[records.length - 1] ?? null;
  const visibleVisits = showAllVisits ? records : records.slice(0, 5);
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
    <div className="space-y-6">
      <section className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--hafta-ylw-50)] text-xl font-bold text-[#181700] ring-1 ring-stone-200">
              {patient?.avatarKey ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={patient.avatarKey} alt="Foto profil" className="h-full w-full object-cover" />
              ) : (
                patient?.fullName?.[0]?.toUpperCase() ?? 'P'
              )}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-[#181700]">{patient?.fullName ?? 'Pasien'}</h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500">
                <span className="rounded-full bg-[var(--hafta-ylw-50)] px-2.5 py-0.5 font-semibold text-[#181700]">
                  {patient?.caseStatus ? `Kasus: ${patient.caseStatus}` : 'Pasien aktif'}
                </span>
                <span>No. RM {patient?.medicalRecordNumber ?? patient?.id?.slice(0, 10).toUpperCase() ?? '-'}</span>
              </div>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 border-t border-stone-100 pt-4 text-sm sm:ml-auto sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0">
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

      <nav
        className="rounded-3xl border border-stone-200 bg-stone-100/90 p-1.5 sm:border-0 sm:bg-transparent sm:p-0"
        aria-label="Bagian rekam medis"
      >
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {TABS.map(({ key, label, icon: Icon }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                aria-pressed={isActive}
                className={cn(
                  'flex min-w-0 cursor-pointer items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-[11px] font-semibold transition-colors sm:h-10 sm:rounded-full sm:px-3.5 sm:text-xs',
                  key === 'dokumen' && 'col-span-2 sm:col-span-1',
                  isActive
                    ? 'border-[#181700] bg-[#181700] text-white'
                    : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300 hover:text-[#181700]',
                )}
              >
                <Icon
                  className={cn(
                    'h-3.5 w-3.5 shrink-0',
                    isActive ? 'text-[var(--hafta-ylw-100)]' : 'text-stone-400',
                  )}
                />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
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
            <section className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
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

              <div className="py-5">
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
                        badge: 'bg-[var(--hafta-ylw-50)] text-[var(--hafta-ylw-900)]',
                        bar: 'bg-[var(--hafta-ylw-200)]',
                      },
                      attention: {
                        badge: 'bg-[var(--hafta-red-50)] text-[var(--hafta-red-700)]',
                        bar: 'bg-[var(--hafta-red-500)]',
                      },
                    };
                    return (
                      <div key={key} className="min-w-0 rounded-2xl border border-stone-200/90 bg-[#FAFAF8] p-4">
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
                  className="mt-4 inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-stone-200 bg-white text-xs font-semibold text-[#181700] transition-colors hover:bg-[var(--hafta-ylw-50)]/50"
                >
                  <CalendarDays className="h-4 w-4" />
                  Lihat riwayat lengkap ({records.length} kunjungan)
                </button>
              ) : null}
            </section>
          ) : activeTab === 'riwayat' ? (
            <section className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3 border-b border-stone-200 pb-4">
                <div>
                  <h3 className="text-base font-bold text-[#181700]">Riwayat Kunjungan</h3>
                  <p className="mt-1 text-xs text-stone-500">Pilih kunjungan untuk membuka detail rekam medis.</p>
                </div>
                <span className="shrink-0 rounded-full bg-[var(--hafta-ylw-50)] px-3 py-1 text-[11px] font-semibold text-[#181700]">
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
              {records.length > 5 ? (
                <button
                  type="button"
                  onClick={() => setShowAllVisits((current) => !current)}
                  className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-[#181700] underline-offset-4 hover:underline"
                >
                  {showAllVisits ? 'Tampilkan lebih sedikit' : `Lihat seluruh ${records.length} kunjungan`}
                  <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showAllVisits && 'rotate-180')} />
                </button>
              ) : null}
            </section>
          ) : activeTab === 'diagnosis' ? (
            <section className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
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
            <section className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
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
            <section className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
              <h3 className="text-base font-bold text-[#181700]">Dokumen & Cetak</h3>
              <p className="mt-1 text-xs text-stone-500">Unduh atau cetak ringkasan rekam medis yang telah dibagikan.</p>
              <div className="mt-2 divide-y divide-stone-100">
                {records.map((record) => (
                  <div key={record.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--hafta-ylw-50)] text-[#181700]">
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
          <section className="rounded-3xl border border-stone-200 bg-white p-5">
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
            <section className="rounded-3xl bg-[var(--hafta-ylw-50)]/55 p-5">
              <h2 className="text-sm font-bold text-[#181700]">Catatan fisioterapis</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#181700]">{patient.therapistNote}</p>
              <p className="mt-3 text-[11px] text-stone-500">
                {patient.therapistNoteAuthor ?? patient.therapistName ?? 'Fisioterapis Hafta'}
                {patient.therapistNoteAt ? ` · ${formatShortDate(patient.therapistNoteAt)}` : ''}
              </p>
            </section>
          ) : null}

          <section className="rounded-3xl border border-stone-200 bg-white p-5">
            <h2 className="text-sm font-bold text-[#181700]">Tim Terapi</h2>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--hafta-ylw-50)] text-[#181700]">
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
