'use client';

import { useMemo, useState } from 'react';
import {
  Activity,
  CalendarCheck,
  CalendarDays,
  ChevronDown,
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
    <div className="space-y-6 pb-28 text-[15px] leading-relaxed text-[#1F2937] lg:pb-8">
      {/* Patient Profile Header Card */}
      <section className="overflow-hidden rounded-2xl border border-[#E9E2D8] bg-white p-5 shadow-[0_6px_22px_rgba(69,45,20,0.04)] sm:p-6 lg:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
          {/* Avatar */}
          <div className="relative shrink-0 self-start sm:self-center">
            <div className="flex h-18 w-18 items-center justify-center overflow-hidden rounded-2xl bg-[#FFF7ED] border-2 border-white shadow-sm ring-2 ring-[#F28C28]/20 text-2xl font-bold text-[#D97706] sm:h-20 sm:w-20 lg:h-22 lg:w-22">
              {patient?.avatarKey ? (
                <img src={patient.avatarKey} alt="Foto profil" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-[#D97706]">
                  {patient?.fullName?.[0]?.toUpperCase() ?? 'P'}
                </span>
              )}
            </div>
          </div>

          {/* Details & Info Grid */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="truncate text-xl font-bold text-[#1F2937] sm:text-2xl">
                {patient?.fullName ?? 'Pasien'}
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF7ED] px-3 py-1 text-xs font-semibold text-[#D97706] border border-[#F28C28]/30">
                <span className="h-1.5 w-1.5 rounded-full bg-[#D97706]" />
                {patient?.caseStatus ? `Kasus: ${patient.caseStatus}` : 'Pasien Aktif'}
              </span>
            </div>

            {/* Responsive Metadata Grid */}
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
              <div className="rounded-xl border border-[#E9E2D8] bg-[#FBF9F6] p-3 transition-colors hover:bg-[#FFF7ED]/40">
                <span className="block text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">No. Rekam Medis</span>
                <strong className="mt-1 block truncate text-xs font-bold text-[#1F2937] sm:text-sm">
                  {patient?.medicalRecordNumber ?? (patient?.id ? patient.id.slice(0, 10).toUpperCase() : '-')}
                </strong>
              </div>

              <div className="rounded-xl border border-[#E9E2D8] bg-[#FBF9F6] p-3 transition-colors hover:bg-[#FFF7ED]/40">
                <span className="block text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">Jenis Kelamin</span>
                <strong className="mt-1 block truncate text-xs font-bold text-[#1F2937] sm:text-sm">
                  {patient?.gender === 'MALE' ? 'Laki-laki' : patient?.gender === 'FEMALE' ? 'Perempuan' : 'Lainnya'}
                </strong>
              </div>

              <div className="rounded-xl border border-[#E9E2D8] bg-[#FBF9F6] p-3 transition-colors hover:bg-[#FFF7ED]/40">
                <span className="block text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">Usia</span>
                <strong className="mt-1 block truncate text-xs font-bold text-[#1F2937] sm:text-sm">
                  {age !== null ? `${age} Tahun` : '-'}
                </strong>
              </div>

              <div className="rounded-xl border border-[#E9E2D8] bg-[#FBF9F6] p-3 transition-colors hover:bg-[#FFF7ED]/40">
                <span className="block text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">Kontak / Email</span>
                <strong
                  className="mt-1 block truncate text-xs font-bold text-[#1F2937] sm:text-sm"
                  title={patient?.email ?? patient?.phone ?? '-'}
                >
                  {patient?.email || patient?.phone || '-'}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Tabs (Desktop & Tablet) */}
      <div className="hidden rounded-2xl border border-[#E9E2D8] bg-white p-1.5 shadow-[0_4px_16px_rgba(69,45,20,0.03)] lg:block">
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
                    ? 'bg-[#FFF7ED] text-[#D97706] border border-[#F28C28]/30 shadow-xs'
                    : 'text-[#6B7280] hover:bg-[#FBF9F6] hover:text-[#1F2937]'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-[#D97706]' : 'text-[#9CA3AF]'}`} />
                {label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile Horizontal Tab Scroll (Above Content) */}
      <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
        {medicalRecordTabs.map(({ key, shortLabel, icon: Icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-all border ${
                isActive
                  ? 'bg-[#FFF7ED] text-[#D97706] border-[#F28C28]/40 shadow-xs'
                  : 'bg-white text-[#6B7280] border-[#E9E2D8] hover:bg-[#FBF9F6]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {shortLabel}
            </button>
          );
        })}
      </div>

      {/* KPI / Summary Metric Cards (When tab is medis) */}
      {activeTab === 'medis' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <section className="rounded-2xl border border-[#E9E2D8] bg-white p-4 shadow-[0_4px_16px_rgba(69,45,20,0.03)] sm:p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#D97706] border border-[#F28C28]/20">
                <CalendarCheck className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#9CA3AF]">Total Kunjungan</p>
                <p className="truncate text-xl font-bold text-[#1F2937]">{records.length} kali</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-[#6B7280]">
              Terakhir: {latestRecord ? latestRecord.recordedAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
            </p>
          </section>

          <section className="rounded-2xl border border-[#E9E2D8] bg-white p-4 shadow-[0_4px_16px_rgba(69,45,20,0.03)] sm:p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#D97706] border border-[#F28C28]/20">
                <TrendingUp className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#9CA3AF]">Progres Terapi</p>
                <p className="truncate text-xl font-bold text-[#1F2937]">{averageProgress}%</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-[#6B7280]">Berdasarkan parameter evaluasi</p>
          </section>

          <section className="rounded-2xl border border-[#E9E2D8] bg-white p-4 shadow-[0_4px_16px_rgba(69,45,20,0.03)] sm:p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#D97706] border border-[#F28C28]/20">
                <Target className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#9CA3AF]">Tujuan Terapi</p>
                <p className="truncate text-sm font-bold text-[#1F2937]">
                  {patient?.therapyGoal || latestRecord?.diagnosis || 'Belum ditentukan'}
                </p>
              </div>
            </div>
            <p className="mt-3 line-clamp-1 text-xs text-[#6B7280]">
              {patient?.therapyDiagnosisLabel || latestRecord?.followUpPlan || 'Belum ada rencana tindak lanjut'}
            </p>
          </section>

          <section className="rounded-2xl border border-[#E9E2D8] bg-white p-4 shadow-[0_4px_16px_rgba(69,45,20,0.03)] sm:p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#D97706] border border-[#F28C28]/20">
                <CalendarDays className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#9CA3AF]">Kunjungan Berikutnya</p>
                <p className="truncate text-sm font-bold text-[#D97706]">
                  {patient?.nextTherapyAt
                    ? patient.nextTherapyAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'Belum dijadwalkan'}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-[#6B7280]">
              {patient?.therapyFrequencyText ? `Frekuensi: ${patient.therapyFrequencyText}` : 'Hubungi klinik untuk jadwal'}
            </p>
          </section>
        </div>
      )}

      {/* Main Content Layout (Left: Content, Right: Sidebar) */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Main Records Area */}
        <main className="space-y-6">
          {records.length === 0 ? (
            <div className="rounded-2xl border border-[#E9E2D8] bg-white p-10 text-center shadow-[0_4px_16px_rgba(69,45,20,0.03)]">
              <Activity className="mx-auto h-12 w-12 text-[#F28C28]" />
              <h3 className="mt-4 text-lg font-bold text-[#1F2937]">Belum ada rekam medis yang dibagikan</h3>
              <p className="mt-1 text-sm text-[#6B7280]">
                Evaluasi dan rekam medis akan tampil di sini setelah difinalisasi oleh tim fisioterapis.
              </p>
            </div>
          ) : activeTab === 'medis' ? (
            <>
              {[selectedRecord]
                .filter((record): record is TherapyProgressView => Boolean(record))
                .map((record) => (
                  <article
                    key={record.id}
                    className="rounded-2xl border border-[#E9E2D8] bg-white p-5 shadow-[0_6px_22px_rgba(69,45,20,0.04)] sm:p-6 lg:p-7"
                  >
                    {/* Record Visit Header */}
                    <header className="flex flex-col gap-4 border-b border-[#E9E2D8] pb-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-[#FFF7ED] border border-[#F28C28]/30 text-center">
                          <strong className="text-xl font-extrabold leading-none text-[#1F2937]">
                            {record.recordedAt.getDate()}
                          </strong>
                          <span className="mt-0.5 text-[10px] font-bold uppercase text-[#D97706]">
                            {record.recordedAt.toLocaleDateString('id-ID', { month: 'short' })}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-[#1F2937]">Kunjungan Terapi Fisio</h3>
                          <p className="text-xs text-[#6B7280]">
                            Fisioterapis:{' '}
                            <span className="font-semibold text-[#1F2937]">{record.therapistName ?? '-'}</span> •{' '}
                            {record.recordedAt.toLocaleDateString('id-ID', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <MedicalRecordActions record={record} />
                      </div>
                    </header>

                    {/* Physical Parameter Scores (Nyeri, ROM, Kekuatan, Fungsi) */}
                    <div className="mt-6">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
                        Evaluasi Parameter Fisik
                      </h4>
                      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                          { label: 'Nyeri', score: record.painScore, icon: HeartPulse },
                          { label: 'ROM (Gerak)', score: record.rangeOfMotionScore, icon: Activity },
                          { label: 'Kekuatan Otot', score: record.strengthScore, icon: UserRound },
                          { label: 'Fungsi Fisik', score: record.functionScore, icon: Activity },
                        ].map(({ label, score, icon: Icon }) => (
                          <div key={label} className="rounded-xl border border-[#E9E2D8] bg-[#FBF9F6] p-3.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="flex items-center gap-1.5 font-semibold text-[#1F2937]">
                                <Icon className="h-3.5 w-3.5 text-[#F28C28]" />
                                {label}
                              </span>
                              <strong className="text-xs font-bold text-[#1F2937]">{score}/10</strong>
                            </div>
                            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#E9E2D8]">
                              <div
                                className="h-full rounded-full bg-[#F28C28] transition-all"
                                style={{ width: scoreWidth(Number(score)) }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Clinical Notes Grid */}
                    <div className="mt-6">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
                        Catatan & Tindakan Klinis
                      </h4>
                      <div className="mt-3 grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
                        {[
                          ['Anamnesis', record.anamnesis],
                          ['Pemeriksaan Fisik & Penunjang', record.physicalExamination],
                          ['Diagnosis Fisioterapi', record.diagnosis],
                          ['Pengobatan & Tindakan Diberikan', record.treatment],
                          ['Rencana Tindak Lanjut & Edukasi', record.followUpPlan],
                          ['Ringkasan & Catatan Tambahan', record.summary],
                        ].map(([label, content]) => (
                          <section
                            key={label}
                            className="min-h-28 rounded-xl border border-[#E9E2D8] bg-[#FBF9F6] p-4 transition-colors hover:bg-[#FFF7ED]/30"
                          >
                            <h5 className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                              {label}
                            </h5>
                            <p className="mt-2 text-xs leading-relaxed text-[#4B5563] sm:text-[13px]">
                              {content || '-'}
                            </p>
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
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#F28C28]/30 bg-[#FFF7ED] px-4 py-3 text-sm font-semibold text-[#D97706] transition-colors hover:bg-[#FFF0DB]"
                >
                  <CalendarDays className="h-4 w-4 text-[#F28C28]" />
                  Lihat riwayat lengkap ({records.length} kunjungan tercatat)
                </button>
              )}
            </>
          ) : activeTab === 'riwayat' ? (
            <div className="rounded-2xl border border-[#E9E2D8] bg-white p-5 shadow-[0_6px_22px_rgba(69,45,20,0.04)] sm:p-6 lg:p-7">
              <div className="flex items-center justify-between border-b border-[#E9E2D8] pb-4">
                <div>
                  <h3 className="text-base font-bold text-[#1F2937]">Riwayat Seluruh Kunjungan</h3>
                  <p className="text-xs text-[#6B7280]">
                    Klik salah satu kunjungan untuk melihat detail rekam medis lengkap.
                  </p>
                </div>
                <span className="rounded-full bg-[#FFF7ED] px-3 py-1 text-xs font-semibold text-[#D97706] border border-[#F28C28]/20">
                  {records.length} Kunjungan
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {visibleTimelineRecords.map((record) => {
                  const isSelected = record.id === selectedRecordId;
                  return (
                    <button
                      key={record.id}
                      type="button"
                      onClick={() => {
                        setSelectedRecordId(record.id);
                        setActiveTab('medis');
                      }}
                      className={`flex w-full cursor-pointer flex-col gap-3 rounded-xl border p-4 text-left transition-all sm:flex-row sm:items-center ${
                        isSelected
                          ? 'border-[#F28C28] bg-[#FFF7ED]/50 ring-1 ring-[#F28C28]'
                          : 'border-[#E9E2D8] bg-white hover:border-[#F28C28]/50 hover:bg-[#FFF7ED]/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-[#FFF7ED] border border-[#F28C28]/30 text-center">
                          <strong className="text-base font-extrabold leading-none text-[#1F2937]">
                            {record.recordedAt.getDate()}
                          </strong>
                          <span className="text-[9px] font-bold uppercase text-[#D97706]">
                            {record.recordedAt.toLocaleDateString('id-ID', { month: 'short' })}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#1F2937]">Kunjungan Terapi</p>
                          <p className="text-xs text-[#6B7280]">
                            Terapis: {record.therapistName ?? '-'} •{' '}
                            {record.recordedAt.toLocaleDateString('id-ID', { year: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2 grid grid-cols-4 gap-2 border-t border-[#E9E2D8] pt-2 text-center sm:mt-0 sm:ml-auto sm:border-t-0 sm:pt-0">
                        {[
                          ['Nyeri', record.painScore],
                          ['ROM', record.rangeOfMotionScore],
                          ['Kekuatan', record.strengthScore],
                          ['Fungsi', record.functionScore],
                        ].map(([label, score]) => (
                          <div key={label} className="rounded-lg bg-[#FBF9F6] px-2 py-1 border border-[#E9E2D8]">
                            <span className="block text-[10px] text-[#9CA3AF]">{label}</span>
                            <strong className="text-xs font-bold text-[#1F2937]">{score}/10</strong>
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>

              {records.length > 4 && (
                <button
                  type="button"
                  onClick={() => setShowAllVisits((current: boolean) => !current)}
                  className="mt-5 flex cursor-pointer items-center gap-2 text-xs font-bold text-[#D97706] hover:text-[#B45309]"
                >
                  {showAllVisits ? 'Tampilkan lebih sedikit' : `Lihat seluruh ${records.length} kunjungan`}
                  <ChevronDown className={`h-4 w-4 transition-transform ${showAllVisits ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>
          ) : activeTab === 'diagnosis' ? (
            <div className="space-y-4">
              {records.map((record) => (
                <article
                  key={record.id}
                  className="rounded-2xl border border-[#E9E2D8] bg-white p-5 shadow-[0_6px_22px_rgba(69,45,20,0.04)] sm:p-6"
                >
                  <header className="flex items-center gap-3 border-b border-[#E9E2D8] pb-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FFF7ED] text-sm font-bold text-[#D97706] border border-[#F28C28]/30">
                      {record.recordedAt.getDate()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1F2937]">Diagnosis Evaluasi</p>
                      <p className="text-[11px] text-[#6B7280]">
                        {record.recordedAt.toLocaleDateString('id-ID', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </header>
                  <div className="mt-4 rounded-xl border border-[#E9E2D8] bg-[#FBF9F6] p-4">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                      Diagnosis Fisioterapi
                    </h4>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#4B5563] sm:text-sm">
                      {record.diagnosis || '-'}
                    </p>
                  </div>
                  <div className="mt-3 rounded-xl border border-[#E9E2D8] bg-[#FBF9F6] p-4">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">Anamnesis</h4>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#4B5563] sm:text-sm">
                      {record.anamnesis || '-'}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ) : activeTab === 'tindakan' ? (
            <div className="space-y-4">
              {records.map((record) => (
                <article
                  key={record.id}
                  className="rounded-2xl border border-[#E9E2D8] bg-white p-5 shadow-[0_6px_22px_rgba(69,45,20,0.04)] sm:p-6"
                >
                  <header className="flex items-center gap-3 border-b border-[#E9E2D8] pb-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FFF7ED] text-sm font-bold text-[#D97706] border border-[#F28C28]/30">
                      {record.recordedAt.getDate()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1F2937]">Tindakan Terapi</p>
                      <p className="text-[11px] text-[#6B7280]">
                        {record.recordedAt.toLocaleDateString('id-ID', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </header>
                  <div className="mt-4 rounded-xl border border-[#E9E2D8] bg-[#FBF9F6] p-4">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                      Pemeriksaan Fisik & Penunjang
                    </h4>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#4B5563] sm:text-sm">
                      {record.physicalExamination || '-'}
                    </p>
                  </div>
                  <div className="mt-3 rounded-xl border border-[#E9E2D8] bg-[#FBF9F6] p-4">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                      Pengobatan & Tindakan Diberikan
                    </h4>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#4B5563] sm:text-sm">
                      {record.treatment || '-'}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((record) => (
                <article
                  key={record.id}
                  className="rounded-2xl border border-[#E9E2D8] bg-white p-5 shadow-[0_6px_22px_rgba(69,45,20,0.04)] sm:p-6"
                >
                  <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#FFF7ED] text-[#D97706] border border-[#F28C28]/30">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#1F2937]">
                          Dokumen Rekam Medis (Kunjungan {record.recordedAt.toLocaleDateString('id-ID')})
                        </p>
                        <p className="text-xs text-[#6B7280]">
                          Terapis: {record.therapistName ?? '-'} • Format PDF Resmi
                        </p>
                      </div>
                    </div>
                    <div className="self-start sm:self-center">
                      <MedicalRecordActions record={record} />
                    </div>
                  </header>
                </article>
              ))}
            </div>
          )}
        </main>

        {/* Aside / Sidebar Panel */}
        <aside className="space-y-5">
          {/* Therapy Summary */}
          <section className="rounded-2xl border border-[#E9E2D8] bg-white p-5 shadow-[0_6px_22px_rgba(69,45,20,0.04)] sm:p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
              Ringkasan Terapi
            </h3>
            <dl className="mt-4 space-y-3.5 text-xs sm:text-sm">
              <div className="flex items-center justify-between gap-3 border-b border-[#E9E2D8] pb-2.5">
                <dt className="text-[#6B7280]">Status Terapi</dt>
                <dd className="rounded-full bg-[#FFF7ED] px-3 py-1 font-bold text-[#D97706] border border-[#F28C28]/30">
                  {patient?.caseStatus ?? 'Aktif'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-[#E9E2D8] pb-2.5">
                <dt className="text-[#6B7280]">Total Kunjungan</dt>
                <dd className="font-bold text-[#1F2937]">
                  {records.length} / {records.length + (patient?.nextTherapyAt ? 1 : 0)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-[#E9E2D8] pb-2.5">
                <dt className="text-[#6B7280]">Terapi Dimulai</dt>
                <dd className="font-bold text-[#1F2937]">
                  {firstRecord
                    ? firstRecord.recordedAt.toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '-'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-[#E9E2D8] pb-2.5">
                <dt className="text-[#6B7280]">Frekuensi</dt>
                <dd className="font-bold text-[#1F2937]">{patient?.therapyFrequencyText ?? '-'}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[#6B7280]">Terapi Berikutnya</dt>
                <dd className="font-bold text-[#D97706]">
                  {patient?.nextTherapyAt
                    ? patient.nextTherapyAt.toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Belum dijadwalkan'}
                </dd>
              </div>
            </dl>
          </section>

          {/* Primary Concern / Chief Complaint */}
          <section className="rounded-2xl border border-[#E9E2D8] bg-white p-5 shadow-[0_6px_22px_rgba(69,45,20,0.04)] sm:p-6">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
              <HeartPulse className="h-4 w-4 text-[#F28C28]" />
              Keluhan Utama & Diagnosis
            </h3>
            <p className="mt-3 text-sm font-bold text-[#1F2937]">
              {latestRecord?.diagnosis ?? patient?.therapyDiagnosisLabel ?? 'Belum tersedia'}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">
              {patient?.therapyGoal ?? latestRecord?.followUpPlan ?? '-'}
            </p>
          </section>

          {/* Therapist in Charge */}
          <section className="rounded-2xl border border-[#E9E2D8] bg-white p-5 shadow-[0_6px_22px_rgba(69,45,20,0.04)] sm:p-6">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
              <UserRound className="h-4 w-4 text-[#F28C28]" />
              Fisioterapis Penanggung Jawab
            </h3>
            <p className="mt-3 text-sm font-bold text-[#1F2937]">
              {patient?.therapistName ?? latestRecord?.therapistName ?? 'Terapis Hafta'}
            </p>
          </section>

          {/* Important Note */}
          <section className="rounded-2xl border border-[#E9E2D8] bg-[#FFF7ED] p-5 shadow-[0_6px_22px_rgba(69,45,20,0.04)] sm:p-6">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D97706]">
              <Phone className="h-4 w-4 text-[#F28C28]" />
              Catatan Penting
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-[#4B5563] sm:text-[13px]">
              {patient?.therapistNote ?? latestRecord?.followUpPlan ?? 'Belum ada catatan tindak lanjut khusus.'}
            </p>
            {patient?.therapistNote && (
              <p className="mt-2 text-[11px] text-[#9CA3AF]">
                Oleh {patient.therapistNoteAuthor ?? patient.therapistName ?? 'Terapis'}
                {patient.therapistNoteAt
                  ? ` • ${patient.therapistNoteAt.toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}`
                  : ''}
              </p>
            )}
          </section>
        </aside>
      </div>

      {/* Fixed Mobile Bottom Navigation Bar with Safe-Area Inset */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E9E2D8] bg-white/95 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(69,45,20,0.08)] backdrop-blur lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {medicalRecordTabs.map(({ key, shortLabel, icon: Icon }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`flex min-h-12 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl px-1 text-center transition-all ${
                  isActive
                    ? 'bg-[#FFF7ED] text-[#D97706] font-bold'
                    : 'text-[#9CA3AF] hover:text-[#D97706] font-medium'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-[#D97706]' : 'text-[#9CA3AF]'}`} />
                <span className="text-[10px] leading-tight truncate">{shortLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
