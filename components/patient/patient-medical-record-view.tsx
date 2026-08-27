'use client';

import { useMemo, useState } from 'react';
import { Activity, CalendarCheck, CalendarDays, ChevronDown, ClipboardList, FileText, HeartPulse, Phone, Stethoscope, Target, TrendingUp, UserRound, type LucideIcon } from 'lucide-react';
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

type TabKey = 'ringkasan' | 'riwayat' | 'diagnosis' | 'tindakan' | 'dokumen';

const medicalRecordTabs: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: 'ringkasan', label: 'Ringkasan', icon: Activity },
  { key: 'riwayat', label: 'Riwayat Kunjungan', icon: CalendarDays },
  { key: 'diagnosis', label: 'Diagnosis', icon: Stethoscope },
  { key: 'tindakan', label: 'Tindakan', icon: ClipboardList },
  { key: 'dokumen', label: 'Dokumen', icon: FileText },
];

export function PatientMedicalRecordView({
  patient,
  records,
}: {
  patient: PatientMedicalRecordSummary | null;
  records: TherapyProgressView[];
}) {
  const [activeTab, setActiveTab] = useState<TabKey>('ringkasan');
  const [selectedRecordId, setSelectedRecordId] = useState(records[0]?.id ?? '');
  const [showAllVisits, setShowAllVisits] = useState(false);
  const latestRecord = records[0] ?? null;
  const firstRecord = records[records.length - 1] ?? null;
  const selectedRecord = useMemo(
    () => records.find((record) => record.id === selectedRecordId) ?? latestRecord,
    [latestRecord, records, selectedRecordId],
  );
  const visibleTimelineRecords = showAllVisits ? records : records.slice(0, 4);
  const age = calculateAge(patient?.dateOfBirth ?? null);
  const averageProgress = records.length
    ? Math.round(records.reduce((total, record) => total + record.rangeOfMotionScore + record.strengthScore + record.functionScore, 0) / (records.length * 30) * 100)
    : 0;

  return (
    <div className="space-y-5 text-[15px] leading-[1.6] text-[#1F2937]">
      <section className="rounded-2xl border border-[#E9E2D8] bg-white px-6 py-5 shadow-[0_8px_26px_rgba(69,45,20,0.04)] sm:py-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-[4.25rem] w-[4.25rem] shrink-0 items-center justify-center rounded-full bg-[#FFF7ED] text-2xl font-bold text-[#D97706]">
              {patient?.fullName?.[0]?.toUpperCase() ?? 'P'}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-[22px] font-bold leading-tight text-[#1F2937]">{patient?.fullName ?? 'Pasien'}</h2>
                <span className="rounded-full bg-[#FFF7ED] px-2.5 py-1 text-[11px] font-semibold text-[#D97706]">Pasien Aktif</span>
              </div>
              <dl className="mt-3 grid gap-x-7 gap-y-2 text-[13px] sm:grid-cols-2 lg:grid-cols-4">
                <div><dt className="text-[#9CA3AF]">ID Pasien</dt><dd className="mt-0.5 font-medium">{patient?.medicalRecordNumber ?? patient?.id.slice(0, 12).toUpperCase() ?? '-'}</dd></div>
                <div><dt className="text-[#9CA3AF]">{patient?.gender === 'MALE' ? 'Laki-laki' : patient?.gender === 'FEMALE' ? 'Perempuan' : 'Lainnya'}</dt><dd className="mt-0.5 font-medium">{age !== null ? `${age} Tahun` : '-'}</dd></div>
                <div><dt className="text-[#9CA3AF]">Telepon</dt><dd className="mt-0.5 font-medium">{patient?.phone ?? '-'}</dd></div>
                <div><dt className="text-[#9CA3AF]">Email</dt><dd className="mt-0.5 truncate font-medium">{patient?.email ?? '-'}</dd></div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <div className="rounded-2xl border border-[#E9E2D8] bg-white shadow-[0_6px_20px_rgba(69,45,20,0.04)]">
        <nav className="flex overflow-x-auto px-3">
          {medicalRecordTabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`cursor-pointer flex min-h-12 shrink-0 items-center gap-2 border-b-2 px-4 text-[13px] font-semibold tracking-wide transition-colors ${activeTab === key ? 'border-[#F28C28] text-[#D97706]' : 'border-transparent text-[#9CA3AF] hover:text-[#6B7280]'}`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'ringkasan' ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <section className="rounded-2xl border border-[#E9E2D8] bg-white p-4 shadow-[0_5px_16px_rgba(69,45,20,0.04)]">
            <div className="flex items-center gap-3"><span className="rounded-xl bg-[#FFF7ED] p-2 text-[#D97706]"><CalendarCheck className="h-5 w-5" /></span><div><p className="text-[11px] font-semibold text-[#9CA3AF]">Total Kunjungan</p><p className="text-[20px] font-bold leading-tight">{records.length} kali</p></div></div>
            <p className="mt-3 text-[12px] text-[#6B7280]">Terakhir: {latestRecord ? latestRecord.recordedAt.toLocaleDateString('id-ID') : '-'}</p>
          </section>
          <section className="rounded-2xl border border-[#E9E2D8] bg-white p-4 shadow-[0_5px_16px_rgba(69,45,20,0.04)]">
            <div className="flex items-center gap-3"><span className="rounded-xl bg-[#FFF7ED] p-2 text-[#D97706]"><TrendingUp className="h-5 w-5" /></span><div><p className="text-[11px] font-semibold text-[#9CA3AF]">Progres Terapi</p><p className="text-[20px] font-bold leading-tight">{averageProgress}%</p></div></div>
            <p className="mt-3 text-[12px] text-[#6B7280]">Berdasarkan parameter evaluasi</p>
          </section>
          <section className="rounded-2xl border border-[#E9E2D8] bg-white p-4 shadow-[0_5px_16px_rgba(69,45,20,0.04)]">
            <div className="flex items-center gap-3"><span className="rounded-xl bg-[#FFF7ED] p-2 text-[#D97706]"><Target className="h-5 w-5" /></span><div><p className="text-[11px] font-semibold text-[#9CA3AF]">Tujuan Terapi</p><p className="text-[14px] font-bold leading-tight">{patient?.therapyGoal || latestRecord?.diagnosis || 'Belum ditentukan'}</p></div></div>
            <p className="mt-3 line-clamp-1 text-[12px] text-[#6B7280]">{patient?.therapyDiagnosisLabel || latestRecord?.followUpPlan || 'Belum ada rencana tindak lanjut'}</p>
          </section>
          <section className="rounded-2xl border border-[#E9E2D8] bg-white p-4 shadow-[0_5px_16px_rgba(69,45,20,0.04)]">
            <div className="flex items-center gap-3"><span className="rounded-xl bg-[#FFF7ED] p-2 text-[#D97706]"><CalendarDays className="h-5 w-5" /></span><div><p className="text-[11px] font-semibold text-[#9CA3AF]">Kunjungan Berikutnya</p><p className="text-[14px] font-bold leading-tight">{patient?.nextTherapyAt?.toLocaleDateString('id-ID') ?? 'Belum dijadwalkan'}</p></div></div>
            <p className="mt-3 text-[12px] text-[#6B7280]">{patient?.therapyFrequencyText ? `Frekuensi: ${patient.therapyFrequencyText}` : 'Hubungi klinik untuk jadwal berikutnya'}</p>
          </section>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_19.5rem]">
        <main className="space-y-5">
          {records.length === 0 ? (
            <div className="rounded-2xl border border-[#E9E2D8] bg-white p-10 text-center shadow-[0_6px_18px_rgba(69,45,20,0.04)]">
              <Activity className="mx-auto h-9 w-9 text-[#F28C28]" />
              <h2 className="mt-3 text-[17px] font-semibold text-[#1F2937]">Belum ada rekam medis yang dibagikan</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-[#6B7280]">Evaluasi akan tampil setelah difinalisasi oleh terapis.</p>
            </div>
          ) : activeTab === 'ringkasan' ? (
            <>
            {[selectedRecord].filter((record): record is TherapyProgressView => Boolean(record)).map((record) => (
              <article key={record.id} className="rounded-2xl border border-[#E9E2D8] bg-white p-5 shadow-[0_5px_18px_rgba(69,45,20,0.04)] sm:p-6">
                <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-[4.25rem] shrink-0 rounded-xl bg-[#FFF7ED] px-3 py-3 text-center">
                      <strong className="block text-[22px] font-bold leading-none text-[#1F2937]">{record.recordedAt.getDate()}</strong>
                      <span className="mt-1 block text-[11px] font-medium uppercase tracking-wide text-[#9CA3AF]">{record.recordedAt.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div>
                      <h2 className="text-[17px] font-bold leading-tight text-[#1F2937]">Kunjungan Terapi</h2>
                      <p className="mt-1 text-[12px] leading-snug text-[#6B7280]">Fisioterapis: {record.therapistName ?? '-'}</p>
                    </div>
                  </div>
                </header>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: 'Nyeri', score: record.painScore, icon: HeartPulse },
                    { label: 'ROM', score: record.rangeOfMotionScore, icon: Activity },
                    { label: 'Kekuatan', score: record.strengthScore, icon: UserRound },
                    { label: 'Fungsi', score: record.functionScore, icon: Activity },
                  ].map(({ label, score, icon: Icon }) => (
                    <div key={label} className="rounded-xl border border-[#E9E2D8] p-3.5">
                      <div className="flex items-center justify-between text-[12px]"><span className="flex items-center gap-1.5 font-semibold text-[#1F2937]"><Icon className="h-4 w-4 text-[#F28C28]" />{label}</span><strong className="text-[13px] font-bold text-[#1F2937]">{score}/10</strong></div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#F3EFE9]"><div className="h-full rounded-full bg-[#F28C28]" style={{ width: scoreWidth(Number(score)) }} /></div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {[
                    ['Anamnesis', record.anamnesis],
                    ['Pemeriksaan Fisik & Penunjang', record.physicalExamination],
                    ['Diagnosis', record.diagnosis],
                    ['Pengobatan & Tindakan', record.treatment],
                    ['Rencana Tindak Lanjut', record.followUpPlan],
                    ['Ringkasan Tambahan', record.summary],
                  ].map(([label, content]) => (
                    <section key={label} className="min-h-32 rounded-xl border border-[#E9E2D8] bg-white p-4">
                      <h3 className="text-[11px] font-bold uppercase tracking-wide text-[#9CA3AF]">{label}</h3>
                      <p className="mt-2.5 text-[13px] leading-[1.65] text-[#4B5563]">{content || '-'}</p>
                    </section>
                  ))}
                </div>
              </article>
            ))}
            {records.length > 1 ? (
              <button
                type="button"
                onClick={() => setActiveTab('riwayat')}
                className="w-full rounded-xl border border-[#F28C28]/20 bg-[#FFF7ED] px-4 py-3 text-[13px] font-semibold text-[#D97706] transition-colors hover:bg-[#FFF0DB]"
              >
                Lihat {records.length - 1} kunjungan lainnya
              </button>
            ) : null}
            </>
          ) : activeTab === 'riwayat' ? (
            <div className="rounded-2xl border border-[#E9E2D8] bg-white p-5 shadow-[0_5px_18px_rgba(69,45,20,0.04)] sm:p-6">
              <h2 className="text-[15px] font-bold text-[#1F2937] mb-4">Riwayat Kunjungan</h2>
              <div className="space-y-4">
                {visibleTimelineRecords.map((record) => (
                  <button
                    key={record.id}
                    type="button"
                    onClick={() => {
                      setSelectedRecordId(record.id);
                      setActiveTab('ringkasan');
                    }}
                    className="flex w-full items-start gap-4 rounded-xl border border-[#E9E2D8] p-4 text-left transition-colors hover:border-[#F28C28]/40 hover:bg-[#FFF7ED]/40"
                  >
                    <div className="w-12 shrink-0 rounded-lg bg-[#FFF7ED] px-2 py-2 text-center">
                      <strong className="block text-[18px] font-bold leading-none text-[#1F2937]">{record.recordedAt.getDate()}</strong>
                      <span className="mt-0.5 block text-[10px] font-medium uppercase text-[#9CA3AF]">{record.recordedAt.toLocaleDateString('id-ID', { month: 'short' })}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#1F2937]">Kunjungan Terapi</p>
                      <p className="text-[12px] text-[#6B7280]">Fisioterapis: {record.therapistName ?? '-'}</p>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[
                        ['Nyeri', record.painScore],
                        ['ROM', record.rangeOfMotionScore],
                        ['Kekuatan', record.strengthScore],
                        ['Fungsi', record.functionScore],
                      ].map(([label, score]) => (
                        <div key={label} className="text-[11px]">
                          <span className="text-[#9CA3AF] block">{label}</span>
                          <strong className="text-[13px] font-bold text-[#1F2937]">{score}/10</strong>
                        </div>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
              {records.length > 4 ? (
                <button
                  type="button"
                  onClick={() => setShowAllVisits((current) => !current)}
                  className="mt-4 flex items-center gap-2 text-[13px] font-semibold text-[#D97706] hover:text-[#B45309]"
                >
                  {showAllVisits ? 'Tampilkan lebih sedikit' : `Lihat semua ${records.length} kunjungan`}
                  <ChevronDown className={`h-4 w-4 transition-transform ${showAllVisits ? 'rotate-180' : ''}`} />
                </button>
              ) : null}
            </div>
          ) : activeTab === 'diagnosis' ? (
            <div className="space-y-4">
              {records.map((record) => (
                <article key={record.id} className="rounded-2xl border border-[#E9E2D8] bg-white p-5 shadow-[0_5px_18px_rgba(69,45,20,0.04)]">
                  <header className="flex items-center gap-3 mb-3">
                    <div className="w-10 shrink-0 rounded-lg bg-[#FFF7ED] px-2 py-2 text-center">
                      <strong className="block text-[16px] font-bold leading-none text-[#1F2937]">{record.recordedAt.getDate()}</strong>
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-[#1F2937]">Kunjungan Terapi</p>
                      <p className="text-[11px] text-[#6B7280]">{record.recordedAt.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </header>
                  <div className="rounded-xl border border-[#E9E2D8] p-4">
                    <h3 className="text-[11px] font-bold uppercase tracking-wide text-[#9CA3AF]">Diagnosis Fisioterapi</h3>
                    <p className="mt-2 text-[13px] leading-[1.65] text-[#4B5563]">{record.diagnosis || '-'}</p>
                  </div>
                  <div className="mt-3 rounded-xl border border-[#E9E2D8] p-4">
                    <h3 className="text-[11px] font-bold uppercase tracking-wide text-[#9CA3AF]">Anamnesis</h3>
                    <p className="mt-2 text-[13px] leading-[1.65] text-[#4B5563]">{record.anamnesis || '-'}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : activeTab === 'tindakan' ? (
            <div className="space-y-4">
              {records.map((record) => (
                <article key={record.id} className="rounded-2xl border border-[#E9E2D8] bg-white p-5 shadow-[0_5px_18px_rgba(69,45,20,0.04)]">
                  <header className="flex items-center gap-3 mb-3">
                    <div className="w-10 shrink-0 rounded-lg bg-[#FFF7ED] px-2 py-2 text-center">
                      <strong className="block text-[16px] font-bold leading-none text-[#1F2937]">{record.recordedAt.getDate()}</strong>
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-[#1F2937]">Kunjungan Terapi</p>
                      <p className="text-[11px] text-[#6B7280]">{record.recordedAt.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </header>
                  <div className="rounded-xl border border-[#E9E2D8] p-4">
                    <h3 className="text-[11px] font-bold uppercase tracking-wide text-[#9CA3AF]">Pemeriksaan Fisik & Penunjang</h3>
                    <p className="mt-2 text-[13px] leading-[1.65] text-[#4B5563]">{record.physicalExamination || '-'}</p>
                  </div>
                  <div className="mt-3 rounded-xl border border-[#E9E2D8] p-4">
                    <h3 className="text-[11px] font-bold uppercase tracking-wide text-[#9CA3AF]">Pengobatan & Tindakan</h3>
                    <p className="mt-2 text-[13px] leading-[1.65] text-[#4B5563]">{record.treatment || '-'}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((record) => (
                <article key={record.id} className="rounded-2xl border border-[#E9E2D8] bg-white p-5 shadow-[0_5px_18px_rgba(69,45,20,0.04)]">
                  <header className="flex items-center gap-3 mb-3">
                    <div className="w-10 shrink-0 rounded-lg bg-[#FFF7ED] px-2 py-2 text-center">
                      <strong className="block text-[16px] font-bold leading-none text-[#1F2937]">{record.recordedAt.getDate()}</strong>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#1F2937]">Kunjungan Terapi</p>
                      <p className="text-[11px] text-[#6B7280]">{record.recordedAt.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </header>
                  <div className="flex items-center gap-2">
                    <MedicalRecordActions record={record} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-[#E9E2D8] bg-white p-5 shadow-[0_6px_20px_rgba(69,45,20,0.04)]">
            <h2 className="text-[13px] font-bold uppercase tracking-wide text-[#9CA3AF]">Ringkasan Terapi</h2>
            <dl className="mt-4 space-y-3.5 text-[13px]">
              <div className="flex items-center justify-between gap-3 rounded-xl">
                <dt className="text-[#9CA3AF]">Status terapi</dt>
                <dd className="text-right font-bold text-[#d97706] bg-[#fff7ed] px-4 py-1 rounded-full">{patient?.caseStatus ?? '-'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#9CA3AF]">Total kunjungan</dt>
                <dd className="font-bold">{records.length} / {records.length + (patient?.nextTherapyAt ? 1 : 0)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#9CA3AF]">Terapi dimulai</dt>
                <dd className="text-right font-bold">{firstRecord?.recordedAt.toLocaleDateString('id-ID') ?? '-'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#9CA3AF]">Frekuensi</dt>
                <dd className="font-bold">{patient?.therapyFrequencyText ?? '-'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#9CA3AF]">Terapi berikutnya</dt>
                <dd className="font-bold text-[#d97706]">{patient?.nextTherapyAt?.toLocaleDateString('id-ID') ?? 'Belum dijadwalkan'}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-[#E9E2D8] bg-white p-5 shadow-[0_6px_20px_rgba(69,45,20,0.04)]">
            <h2 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-[#9CA3AF]"><HeartPulse className="h-4 w-4 text-[#F28C28]" /> Keluhan Utama</h2>
            <p className="mt-3.5 text-[14px] font-semibold text-[#1F2937]">{latestRecord?.diagnosis ?? patient?.therapyDiagnosisLabel ?? 'Belum tersedia.'}</p>
            <p className="mt-1 text-[13px] leading-[1.65] text-[#6B7280]">{patient?.therapyGoal ?? latestRecord?.followUpPlan ?? '-'}</p>
          </section>

          <section className="rounded-2xl border border-[#E9E2D8] bg-white p-5 shadow-[0_6px_20px_rgba(69,45,20,0.04)]">
            <h2 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-[#9CA3AF]"><UserRound className="h-4 w-4 text-[#F28C28]" /> Fisioterapis Penanggung Jawab</h2>
            <p className="mt-3.5 text-[14px] font-semibold text-[#1F2937]">{patient?.therapistName ?? latestRecord?.therapistName ?? 'Belum ditentukan'}</p>
          </section>

          <section className="rounded-2xl border border-[#E9E2D8] bg-[#FFF7ED] p-5 shadow-[0_6px_20px_rgba(69,45,20,0.04)]">
            <h2 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-[#9CA3AF]"><Phone className="h-4 w-4 text-[#F28C28]" /> Catatan Penting</h2>
            <p className="mt-3.5 text-[13px] leading-[1.65] text-[#4B5563]">{patient?.therapistNote ?? latestRecord?.followUpPlan ?? 'Belum ada catatan tindak lanjut.'}</p>
            {patient?.therapistNote ? <p className="mt-1 text-[11px] text-[#9CA3AF]">Ditambahkan oleh {patient.therapistNoteAuthor ?? patient.therapistName ?? '-'}{patient.therapistNoteAt ? ` • ${patient.therapistNoteAt.toLocaleDateString('id-ID')}` : ''}</p> : null}
          </section>
        </aside>
      </div>
    </div>
  );
}
