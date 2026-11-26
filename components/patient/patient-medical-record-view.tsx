'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Activity,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Crosshair,
  Dumbbell,
  FileText,
  HeartPulse,
  Maximize2,
  NotebookPen,
  PenLine,
  Printer,
  Stethoscope,
  TrendingUp,
} from 'lucide-react';
import { GlobalModal } from '@/components/ui/global-modal';
import { GlobalSlideOver } from '@/components/ui/global-slide-over';
import { Button, buttonVariants } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MedicalRecordPrintDialog } from '@/components/pdf/medical-record-print-dialog';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { RecoveryWorkspace, type RecoverySession } from '@/components/patient/recovery-workspace';
import {
  CLINICAL_ROWS,
  deltaForMetric,
  labelRecordStatus,
  longDate,
  METRICS,
  metricTone,
  shortDate,
  sparklinePoints,
  TONE_DELTA,
  TONE_PILL,
  TONE_TRACK,
} from '@/components/patient/medical-record-utils';
import { detectBodyRegions, REGION_POINTS, type DetectedRegion } from '@/components/patient/body-condition-map';
import { TherapyAnatomyStage } from '@/components/patient/therapy-anatomy-stage';
import { ANATOMY_SYSTEMS } from '@/components/patient/body-anatomy-atlas';
import { cn } from '@/lib/utils';
import type { PatientMedicalRecordSummary, TherapyProgressView } from '@/server/queries/therapy-progress';
import type { HomeProgramView } from '@/server/queries/home-programs';
import type { TreatmentPlanView } from '@/server/queries/treatment-plans';

type TherapySession = RecoverySession;

type TabKey = 'ringkasan' | 'kunjungan' | 'diagnosis' | 'tindakan' | 'dokumen';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'ringkasan', label: 'Ringkasan' },
  { key: 'kunjungan', label: 'Kunjungan' },
  { key: 'diagnosis', label: 'Diagnosis' },
  { key: 'tindakan', label: 'Tindakan' },
  { key: 'dokumen', label: 'Dokumen' },
];

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
  INTAKE: 'Penerimaan awal',
  INACTIVE: 'Tidak aktif',
  DISCHARGED: 'Selesai terapi',
  ON_HOLD: 'Ditunda',
  ARCHIVED: 'Diarsipkan',
};

const labelGender = (value: string | null | undefined) => (value ? (GENDER_LABEL[value.toUpperCase()] ?? value) : '-');

const labelCaseStatus = (value: string | null | undefined) =>
  value ? (CASE_STATUS_LABEL[value.toUpperCase()] ?? value) : 'Aktif';

function formatAge(dateOfBirth: Date | null) {
  if (!dateOfBirth) return '—';
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const month = today.getMonth() - dateOfBirth.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < dateOfBirth.getDate())) age -= 1;
  return `${age} tahun`;
}

function regionThumbnail(marker: DetectedRegion): string {
  switch (marker.key) {
    case 'kepala':
      return '/assets/body-anatomy/head-neck.webp';
    case 'leher':
      return '/assets/body-anatomy/head-neck-back.webp';
    case 'bahu':
    case 'lengan':
      return marker.side === 'kanan'
        ? '/assets/body-anatomy/right-arm.webp'
        : '/assets/body-anatomy/left-arm.webp';
    case 'dada':
    case 'perut':
    case 'pinggul':
      return '/assets/body-anatomy/torso.webp';
    case 'punggung':
      return '/assets/body-anatomy/back-musculature.webp';
    case 'lutut':
    case 'kaki':
      return marker.side === 'kanan'
        ? '/assets/body-anatomy/right-leg-and-foot.webp'
        : '/assets/body-anatomy/left-leg-and-foot.webp';
  }
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
  // Tab di-derive dari URL (?tab=…) + override lokal, bukan disinkronkan lewat
  // effect — server dan client render sama dari awal (bebas hydration mismatch)
  // dan tab bisa dibagikan/di-refresh tanpa hilang.
  const searchParams = useSearchParams();
  const [tabOverride, setTabOverride] = useState<TabKey | null>(null);
  const urlTab = searchParams.get('tab');
  const activeTab: TabKey =
    tabOverride ?? (urlTab && TABS.some((tab) => tab.key === urlTab) ? (urlTab as TabKey) : 'ringkasan');

  function selectTab(tab: TabKey) {
    setTabOverride(tab);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', tab);
    window.history.replaceState(null, '', `?${params.toString()}`);
  }
  const [selectedRecordId, setSelectedRecordId] = useState(records[0]?.id ?? '');
  const [detailRecord, setDetailRecord] = useState<TherapyProgressView | null>(null);
  /** Pratinjau cetak/unduh via PDF.js global (MedicalRecordPrintDialog). */
  const [printRecord, setPrintRecord] = useState<TherapyProgressView | null>(null);
  const [programOpen, setProgramOpen] = useState(false);
  /** Workspace Perjalanan Pemulihan diperluas lewat modal global. */
  const [workspaceExpanded, setWorkspaceExpanded] = useState(false);
  /** Penanda atlas yang diaktifkan dari daftar area keluhan (kolom kanan). */
  const [focusRegionId, setFocusRegionId] = useState<string | null>(null);
  /** Id penanda aktif saat ini — sinkron dengan viewer (highlight daftar area). */
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const [visitPage, setVisitPage] = useState(1);
  const [visitsPerPage, setVisitsPerPage] = useState(5);
  const [docsPage, setDocsPage] = useState(1);
  const [docsPerPage, setDocsPerPage] = useState(6);
  const [diagnosisPage, setDiagnosisPage] = useState(1);
  const [tindakanPage, setTindakanPage] = useState(1);

  const selectedRecord = useMemo(
    () => records.find((record) => record.id === selectedRecordId) ?? records[0] ?? null,
    [records, selectedRecordId],
  );

  const chronological = useMemo(
    () => [...records].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()),
    [records],
  );

  /**
   * Kelompokkan rekam per KUNJUNGAN (tanggal pemeriksaan):
   * - Amandemen memakai `recordedAt` yang SAMA dengan rekam aslinya, jadi satu
   *   tanggal = satu kunjungan; revisi tertinggi (`revisionNumber`) menjadi
   *   nilai terbaru (`latest`) dan tetap diberi label amandemen.
   * - Rekam lama yang sudah superseded disembunyikan dari pasien, sehingga
   *   amandemen kadang datang tanpa rekam dasarnya — tetap dikelompokkan per
   *   tanggal, bukan dihitung sebagai sesi baru.
   * - Tab Dokumen tetap menampilkan SEMUA berkas (termasuk amandemen) secara
   *   individual, jadi tidak ada data yang hilang.
   * Amandemen TIDAK PERNAH menambah jumlah kunjungan.
   */
  const sessions = useMemo<TherapySession[]>(() => {
    const dayKey = (record: TherapyProgressView) => {
      const date = new Date(record.recordedAt);
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    };
    const revisionOf = (record: TherapyProgressView) => (record.amendedFromId ? (record.revisionNumber ?? 2) : 1);
    const grouped = new Map<string, TherapyProgressView[]>();
    for (const record of chronological) {
      const key = dayKey(record);
      const members = grouped.get(key) ?? [];
      members.push(record);
      grouped.set(key, members);
    }
    return Array.from(grouped.entries())
      .map(([, members]) => {
        const sorted = [...members].sort((a, b) => revisionOf(a) - revisionOf(b));
        const bases = sorted.filter((member) => !member.amendedFromId);
        const amendments = sorted.filter((member) => Boolean(member.amendedFromId));
        const base = bases[0] ?? sorted[0];
        const latest = sorted[sorted.length - 1];
        return { base, latest, amendments };
      })
      .sort((a, b) => new Date(a.base.recordedAt).getTime() - new Date(b.base.recordedAt).getTime());
  }, [chronological]);

  /** Rekam mana pun → sesinya (untuk badge & nomor yang konsisten). */
  const sessionByRecordId = useMemo(() => {
    const map = new Map<string, TherapySession>();
    for (const session of sessions) {
      map.set(session.base.id, session);
      map.set(session.latest.id, session);
      for (const amendment of session.amendments) map.set(amendment.id, session);
    }
    return map;
  }, [sessions]);

  /** Nomor sesi per rekam — amandemen memakai nomor sesi aslinya. */
  const visitNumberById = useMemo(() => {
    const map = new Map<string, number>();
    sessions.forEach((session, index) => {
      map.set(session.base.id, index + 1);
      map.set(session.latest.id, index + 1);
      for (const amendment of session.amendments) map.set(amendment.id, index + 1);
    });
    return map;
  }, [sessions]);

  /** Revisi amandemen terakhir per sesi (null bila belum pernah diamandemen). */
  const amendedRevisionByRecordId = useMemo(() => {
    const map = new Map<string, number>();
    for (const session of sessions) {
      const last = session.amendments[session.amendments.length - 1];
      if (last) map.set(session.latest.id, last.revisionNumber ?? session.amendments.length + 1);
    }
    return map;
  }, [sessions]);

  /** Delta selalu dibandingkan dengan KUNJUNGAN sebelumnya (versi terbarunya). */
  const previousRecord = useMemo(() => {
    if (!selectedRecord) return null;
    const index = sessions.findIndex(
      (session) =>
        session.base.id === selectedRecord.id ||
        session.latest.id === selectedRecord.id ||
        session.amendments.some((amendment) => amendment.id === selectedRecord.id),
    );
    if (index > 0) return sessions[index - 1].latest;
    // Fallback: rekam tidak terkelompokkan (mis. dasarnya tidak ikut terkirim).
    const fallbackIndex = chronological.findIndex((record) => record.id === selectedRecord.id);
    return fallbackIndex > 0 ? chronological[fallbackIndex - 1] : null;
  }, [chronological, sessions, selectedRecord]);

  /** Satu sumber aksi untuk grafik, kalender, dan daftar kunjungan. */
  const openSession = useCallback((record: TherapyProgressView) => {
    setSelectedRecordId(record.id);
    setDetailRecord(record);
  }, []);

  const latestRecord = records[0] ?? null;
  const firstRecord = sessions[0]?.base ?? chronological[0] ?? null;

  // Jadwal berikutnya ter-resolve dari appointment aktif + pengajuan PENDING.
  const nextSchedule = patient?.nextSchedule ?? null;
  const nextScheduleDateLabel = nextSchedule ? shortDate(nextSchedule.dateAt) : '—';
  const nextScheduleDetail = (() => {
    if (!nextSchedule) return 'belum dijadwalkan';
    const time = `${nextSchedule.timeText} WIB`;
    if (nextSchedule.source === 'PENDING_RESCHEDULE') return `${time} · Pengajuan ubah jadwal`;
    if (nextSchedule.source === 'PENDING_REQUEST') return `${time} · Menunggu konfirmasi`;
    return `${time} · Terjadwal`;
  })();

  // Nilai terbaru per kunjungan (amandemen sudah menggantikan rekam lamanya).
  const visitRecords = useMemo(() => sessions.map((session) => session.latest), [sessions]);

  /** Area tubuh yang disebut diagnosis/anamnesis sesi terpilih — penanda peta tubuh. */
  const bodyRegions = useMemo(
    () =>
      selectedRecord
        ? detectBodyRegions(
            selectedRecord.diagnosis,
            selectedRecord.anamnesis,
            selectedRecord.physicalExamination,
            selectedRecord.treatment,
          )
        : [],
    [selectedRecord],
  );
  /** Nada penanda mengikuti skor nyeri sesi (bukan area spesifik — jujur ke data). */
  const bodyTone = selectedRecord ? metricTone('pain', Number(selectedRecord.painScore ?? 0)).tone : 'watch';

  /** Pemilihan sesi dari workspace Perjalanan Pemulihan (grafik/kalender/perkembangan). */
  const selectRecordById = useCallback((recordId: string) => {
    setSelectedRecordId(recordId);
  }, []);

  /** Id penanda atlas — format sama dengan viewer (`key:sisi`). */
  const regionMarkerId = (region: DetectedRegion) => `${region.key}:${region.side ?? '-'}`;
  const regionDisplayName = (region: DetectedRegion) =>
    region.side ? `${REGION_POINTS[region.key].label} ${region.side}` : REGION_POINTS[region.key].label;
  // Kunjungan, Diagnosis, dan Tindakan dihitung per KUNJUNGAN (nilai terbaru),
  // bukan per rekam — amandemen tidak menggandakan baris.
  const visitPageCount = Math.max(1, Math.ceil(visitRecords.length / visitsPerPage));
  const safeVisitPage = Math.min(visitPage, visitPageCount);
  const visibleVisits = visitRecords.slice((safeVisitPage - 1) * visitsPerPage, safeVisitPage * visitsPerPage);
  const docsPageCount = Math.max(1, Math.ceil(records.length / docsPerPage));
  const safeDocsPage = Math.min(docsPage, docsPageCount);
  const visibleDocs = records.slice((safeDocsPage - 1) * docsPerPage, safeDocsPage * docsPerPage);
  /** Diagnosis & tindakan: 6 baris per halaman agar tidak memanjang. */
  const clinicalPageCount = Math.max(1, Math.ceil(visitRecords.length / 6));
  const safeDiagnosisPage = Math.min(diagnosisPage, clinicalPageCount);
  const safeTindakanPage = Math.min(tindakanPage, clinicalPageCount);
  const visibleDiagnosis = visitRecords.slice((safeDiagnosisPage - 1) * 6, safeDiagnosisPage * 6);
  const visibleTindakan = visitRecords.slice((safeTindakanPage - 1) * 6, safeTindakanPage * 6);
  const averageScore = sessions.length
    ? Math.round(
        (sessions.reduce(
          (total, session) =>
            total + session.latest.rangeOfMotionScore + session.latest.strengthScore + session.latest.functionScore,
          0,
        ) /
          (sessions.length * 30)) *
          100,
      )
    : 0;

  function openRecord(recordId: string) {
    setSelectedRecordId(recordId);
    setTabOverride('ringkasan');
  }

  /** Aset dekoratif kartu — dari registri atlas (bukan path hardcode). */
  const decorSkeletal = ANATOMY_SYSTEMS.find((item) => item.key === 'skeletal')?.anterior;
  const decorMuscular = ANATOMY_SYSTEMS.find((item) => item.key === 'muscular')?.anterior;
  const decorNervous = ANATOMY_SYSTEMS.find((item) => item.key === 'nervous')?.anterior;
  const decorPosterior = ANATOMY_SYSTEMS.find((item) => item.key === 'muscular')?.posterior;
  const decorArticular = ANATOMY_SYSTEMS.find((item) => item.key === 'articular')?.anterior;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* ── 3. TABS — global Tabs component (Radix) ── */}
      <Tabs value={activeTab} onValueChange={(value) => selectTab(value as TabKey)} className="py-2 sm:py-3">
        <TabsList
          aria-label="Bagian rekam medis"
          className="mx-auto flex h-auto w-full max-w-lg items-center justify-start gap-2 overflow-x-auto rounded-full border border-border/60 bg-muted/60 p-1 backdrop-blur-sm [scrollbar-width:none] sm:justify-center [&::-webkit-scrollbar]:hidden"
          style={{ touchAction: 'manipulation' }}
        >
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.key}
              value={tab.key}
              className={cn(
                'min-h-9 shrink-0 cursor-pointer rounded-full px-4 text-[13px] font-medium transition-colors data-[state=active]:bg-hafta-org-400 data-[state=active]:text-white',
                activeTab === tab.key ? 'text-white' : 'text-stone-600 hover:text-foreground',
              )}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* ── 4. KONTEN ── */}
      {records.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--hafta-50)]">
            <Activity className="h-5 w-5 text-[var(--hafta-400)]" />
          </span>
          <p className="mt-4 text-base font-semibold text-foreground">Belum ada rekam medis</p>
          <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Catatan evaluasi akan tampil setelah fisioterapis menyelesaikan sesi dan membagikannya kepada Anda.
          </p>
          <Link
            href="/dashboard/appointments"
            className="mt-4 inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-[var(--hafta-300)] px-5 text-sm font-bold text-[#181700] transition-colors hover:bg-[var(--hafta-400)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
          >
            Ajukan Jadwal Terapi
          </Link>
        </div>
      ) : activeTab === 'ringkasan' && selectedRecord ? (
        <>
          {/* ── clinical overview: 12-col grid — kiri metrik | tengah atlas | kanan info klinis ── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start">
            {/* ── KOLOM KIRI (4): identitas pasien + metrik evaluasi + sesi/fisioterapis + kekuatan/fungsi ── */}
            <div className="min-w-0 space-y-4 lg:col-span-4">
              <header className="hafta-card relative overflow-hidden p-4 sm:p-5">
                <Image
                  src="/assets/body-anatomy/articular-system.webp"
                  alt=""
                  aria-hidden="true"
                  width={220}
                  height={280}
                  className="pointer-events-none absolute -right-4 top-3 h-full w-48 object-cover object-top [mask-image:linear-gradient(to_right,transparent_0%,black_50%)] sm:w-52 opacity-40"
                />
                <div className="relative z-10 pr-24 sm:pr-28">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                      {patient?.preferredName ?? patient?.fullName ?? 'Pasien'}
                    </h1>
                    <span className="rounded-full bg-[var(--hafta-50)] px-2 py-0.5 text-xs font-medium text-[var(--hafta-700)]">
                      {labelCaseStatus(patient?.caseStatus)}
                    </span>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5">
                    {[
                      { label: 'Usia', value: formatAge(patient?.dateOfBirth ?? null) },
                      { label: 'Jenis Kelamin', value: labelGender(patient?.gender) },
                      { label: 'No. Rekam Medis', value: patient?.medicalRecordNumber ?? '-', tabular: true },
                      {
                        label: 'Fisioterapis',
                        value: patient?.therapistName ?? latestRecord?.therapistName ?? 'Fisioterapis Hafta',
                      },
                    ].map((item) => (
                      <div key={item.label} className="min-w-0">
                        <dt className="text-xs font-semibold text-muted-foreground">{item.label}</dt>
                        <dd className={cn('mt-0.5 truncate text-sm font-medium text-foreground', item.tabular && 'tabular-nums')}>
                          {item.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </header>
              {/* baris 1: dua kartu metrik utama — VAS & ROM (sparkline dari data sesi nyata) */}
              <div className="grid grid-cols-2 gap-3">
                {(['pain', 'rom'] as const).map((metricKey) => {
                  const metric = METRICS.find((item) => item.key === metricKey);
                  if (!metric) return null;
                  const value = Number(selectedRecord[metric.field] ?? 0);
                  const tone = metricTone(metricKey, value);
                  const values = sessions.map((session) => Number(session.latest[metric.field] ?? 0));
                  const decor = metricKey === 'pain' ? decorNervous : decorArticular;
                  // Tint + palet per metrik agar kartu tidak monoton putih dan
                  // warna garis grafik serta teks selaras dengan latarnya.
                  const palette =
                    metricKey === 'pain'
                      ? {
                          tint: 'border-[var(--hafta-100)] bg-[var(--hafta-50)]',
                          stroke: 'var(--hafta-400)',
                          label: 'text-[var(--hafta-700)]',
                          value: 'text-[var(--hafta-900)]',
                          suffix: 'text-[var(--hafta-600)]',
                        }
                      : {
                          tint: 'border-[var(--hafta-grn-100)] bg-[var(--hafta-grn-50)]',
                          stroke: 'var(--hafta-grn-500)',
                          label: 'text-[var(--hafta-grn-700)]',
                          value: 'text-[var(--hafta-grn-900)]',
                          suffix: 'text-[var(--hafta-grn-600)]',
                        };
                  return (
                    <section
                      key={metricKey}
                      aria-label={`${metric.label} sesi ini`}
                      className={cn(
                        'relative overflow-hidden rounded-[28px] border p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)]',
                        palette.tint,
                      )}
                    >
                      {/* siluet anatomi dekoratif pada kartu metrik */}
                      {decor ? (
                        <Image
                          src={decor.url}
                          alt=""
                          aria-hidden="true"
                          width={decor.width}
                          height={decor.height}
                          className="pointer-events-none absolute -right-2 bottom-0 h-[75%] w-auto opacity-[0.08]"
                        />
                      ) : null}
                      <div className="relative flex items-start justify-between gap-1.5">
                        <p className={cn('text-xs font-semibold', palette.label)}>{metric.label}</p>
                        <span
                          className={cn(
                            'shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold',
                            TONE_PILL[tone.tone],
                          )}
                        >
                          {tone.label}
                        </span>
                      </div>
                      <div className="relative mt-2 flex items-baseline gap-1">
                        <span className={cn('text-2xl font-bold tabular-nums', palette.value)}>{value}</span>
                        <span className={cn('text-[10px] font-medium', palette.suffix)}>/10</span>
                      </div>
                      <svg aria-hidden="true" viewBox="0 0 120 40" className="mt-2 h-9 w-full" fill="none">
                        <polyline
                          points={sparklinePoints(values, 10)}
                          stroke={palette.stroke}
                          strokeWidth="2"
                          strokeLinejoin="round"
                          strokeLinecap="round"
                        />
                      </svg>
                    </section>
                  );
                })}
              </div>

              {/* baris 2: total sesi + jadwal berikutnya + profil fisioterapis */}
              <section
                aria-label="Sesi dan fisioterapis"
                className="relative overflow-hidden rounded-[28px] border border-border bg-card p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)] sm:p-5"
              >
                {/* siluet anatomi dekoratif — aset atlas, opasitas rendah */}
                {decorSkeletal ? (
                  <Image
                    src={decorSkeletal.url}
                    alt=""
                    aria-hidden="true"
                    width={decorSkeletal.width}
                    height={decorSkeletal.height}
                    className="pointer-events-none absolute -right-3 bottom-0 h-[80%] w-auto opacity-[0.06]"
                  />
                ) : null}
                <div className="relative">
                  <div className="flex items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--hafta-50)] text-[var(--hafta-700)]"
                    >
                      <Stethoscope className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {nextSchedule?.therapistName ??
                          patient?.therapistName ??
                          latestRecord?.therapistName ??
                          'Fisioterapis Hafta'}
                      </p>
                      <p className="text-xs text-muted-foreground">Fisioterapis</p>
                    </div>
                    <Link
                      href="/dashboard/appointments"
                      className={cn(buttonVariants({ variant: 'outline', size: 'xs' }), 'shrink-0 gap-1.5')}
                    >
                      <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />
                      Lihat Jadwal
                    </Link>
                  </div>
                </div>
              </section>

              {/* baris 3: kekuatan & fungsi + progress bar + badge selisih */}
              <section
                aria-label="Kekuatan dan fungsi"
                className="hafta-card p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)] sm:p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground">Kekuatan &amp; Fungsi</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Evaluasi Sesi {visitNumberById.get(selectedRecord.id) ?? 1} ·{' '}
                      {longDate(selectedRecord.recordedAt)}
                    </p>
                  </div>
                  {selectedRecord.amendedFromId ? (
                    <span className="shrink-0 rounded-full border border-[var(--hafta-org-200)] bg-[var(--hafta-org-50)] px-2 py-0.5 text-xs font-semibold text-[var(--hafta-org-700)]">
                      Revisi R{selectedRecord.revisionNumber ?? 2}
                    </span>
                  ) : null}
                </div>
                <dl className="mt-3 divide-y divide-border/70 border-t border-border/70">
                  {(['strength', 'function'] as const).map((metricKey) => {
                    const metric = METRICS.find((item) => item.key === metricKey);
                    if (!metric) return null;
                    const value = Number(selectedRecord[metric.field] ?? 0);
                    const previous = previousRecord ? Number(previousRecord[metric.field] ?? 0) : null;
                    const change = deltaForMetric(metricKey, value, previous);
                    const tone = metricTone(metricKey, value);
                    const Icon = metric.icon;
                    return (
                      <div key={metricKey} className="py-2.5">
                        <div className="flex items-baseline justify-between gap-2">
                          <dt className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <Icon className="h-3 w-3 text-[var(--hafta-300)]" />
                            {metric.label}
                          </dt>
                          <dd className="flex min-w-0 flex-wrap items-baseline justify-end gap-1">
                            <span className="text-lg font-bold leading-none tabular-nums text-foreground">{value}</span>
                            <span className="text-[10px] text-muted-foreground">/10</span>
                            {change ? (
                              <span
                                className={cn(
                                  'text-xs font-semibold tabular-nums',
                                  change.isGood ? TONE_DELTA.up : TONE_DELTA.down,
                                )}
                              >
                                {change.text}
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">tetap</span>
                            )}
                            <span
                              className={cn(
                                'rounded-full px-1.5 py-0.5 text-[9px] font-semibold',
                                TONE_PILL[tone.tone],
                              )}
                            >
                              {tone.label}
                            </span>
                          </dd>
                        </div>
                        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-stone-200/70">
                          <span
                            className={cn('block h-full rounded-full', TONE_TRACK[tone.tone])}
                            style={{ width: `${Math.max(4, value * 10)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </dl>
              </section>
            </div>

            {/* ── KOLOM TENGAH (4): Interactive Anatomy Viewer — fokus visual utama ── */}
            <div className="min-w-0 lg:col-span-4">
              <TherapyAnatomyStage
                markers={bodyRegions}
                tone={bodyTone}
                detail={
                  selectedRecord.diagnosis || selectedRecord.treatment
                    ? {
                        condition: selectedRecord.diagnosis ?? '',
                        therapyMethod: selectedRecord.treatment ?? '',
                      }
                    : null
                }
                onRegionSelect={() => openSession(selectedRecord)}
                onActiveMarkerChange={setActiveMarkerId}
                focusRegionId={focusRegionId}
                fallbackHint="Area keluhan akan ditandai otomatis dari diagnosis sesi terpilih."
              />
            </div>

            {/* ── KOLOM KANAN (4): panel info klinis — scroll vertikal sejajar tinggi atlas ── */}
            <aside
              aria-label="Panel informasi klinis"
              className="min-w-0 space-y-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:col-span-4 lg:max-h-[640px] lg:overflow-y-auto lg:pb-8 lg:pr-1 lg:[mask-image:linear-gradient(to_bottom,black_0%,black_calc(100%-32px),transparent_100%)]"
            >
              {/* statistik ringkas — di dalam panel scroll kanan */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    label: 'Total Sesi',
                    value: `${sessions.length}`,
                    detail: firstRecord ? `sejak ${shortDate(firstRecord.recordedAt)}` : 'belum ada sesi',
                    valueClass: 'text-xl leading-none tracking-tight sm:text-2xl',
                  },
                  {
                    label: 'Progres',
                    value: `${averageScore}%`,
                    detail: 'rata-rata ROM, kekuatan & fungsi',
                    valueClass: 'text-xl leading-none tracking-tight sm:text-2xl',
                  },
                  {
                    label: 'Berikutnya',
                    value: nextScheduleDateLabel,
                    detail: nextScheduleDetail,
                    valueClass: 'text-sm leading-tight tracking-tight sm:text-base',
                  },
                ].map((stat) => (
                  <div key={stat.label} className="hafta-card p-3">
                    <p className="text-[10px] font-medium text-muted-foreground">{stat.label}</p>
                    <p className={cn('mt-1.5 font-semibold tabular-nums text-foreground', stat.valueClass)}>
                      {stat.value}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-muted-foreground">{stat.detail}</p>
                  </div>
                ))}
              </div>

              {/* diagnosis terkini — permukaan netral + siluet anatomi dekoratif */}
              <section
                aria-label="Diagnosis terkini"
                className="relative overflow-hidden rounded-[28px] border border-border bg-card p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)] sm:p-5"
              >
                {decorPosterior ? (
                  <Image
                    src={decorPosterior.url}
                    alt=""
                    aria-hidden="true"
                    width={decorPosterior.width}
                    height={decorPosterior.height}
                    className="pointer-events-none absolute -right-2 bottom-0 h-[85%] w-auto opacity-[0.07]"
                  />
                ) : null}
                <div className="relative">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="inline-flex items-center gap-1.5 text-base font-semibold tracking-tight text-foreground">
                      <Stethoscope className="h-3.5 w-3.5 text-[var(--hafta-300)]" />
                      Diagnosis Terkini
                    </h2>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold',
                        selectedRecord.status === 'FINALIZED'
                          ? TONE_PILL.good
                          : 'bg-secondary/60 text-muted-foreground',
                      )}
                    >
                      {labelRecordStatus(selectedRecord.status)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-foreground">
                    {selectedRecord.diagnosis || 'Belum ada diagnosis tercatat pada sesi terpilih.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => openSession(selectedRecord)}
                    className="tap-target mt-3 -ml-2.5 inline-flex min-h-9 cursor-pointer items-center gap-1 rounded-full px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
                  >
                    Lihat catatan lengkap
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </section>

              {/* area keluhan — klik mengaktifkan penanda pada Atlas */}
              <section aria-label="Area keluhan tercatat" className="hafta-card p-4 sm:p-5">
                <h2 className="inline-flex items-center gap-1.5 text-base font-semibold tracking-tight text-foreground">
                  <Crosshair className="h-3.5 w-3.5 text-[var(--hafta-300)]" />
                  Area Keluhan
                </h2>
                {bodyRegions.length > 0 ? (
                  <ul className="mt-2.5 flex flex-wrap gap-1.5">
                    {bodyRegions.map((marker) => {
                      const id = regionMarkerId(marker);
                      const isActive = activeMarkerId === id;
                      return (
                        <li key={id}>
                          <button
                            type="button"
                            aria-pressed={isActive}
                            title="Aktifkan penanda pada Atlas anatomi"
                            onClick={() => {
                              setFocusRegionId(id);
                              setActiveMarkerId(id);
                            }}
                            className={cn(
                              'tap-target inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full border pl-1.5 pr-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35',
                              isActive
                                ? 'border-transparent bg-[var(--hafta-950)] text-white'
                                : 'border-border text-foreground hover:bg-accent',
                            )}
                          >
                            <Image
                              src={regionThumbnail(marker)}
                              alt=""
                              aria-hidden="true"
                              width={22}
                              height={22}
                              className={cn(
                                'h-5.5 w-5.5 shrink-0 rounded-full object-cover',
                                marker.key === 'lutut' || marker.key === 'kaki' ? 'object-bottom' : 'object-center',
                                isActive ? 'bg-white/15' : 'bg-muted/50',
                              )}
                            />
                            {regionDisplayName(marker)}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    Belum ada area tubuh yang terdeteksi dari diagnosis sesi terpilih.
                  </p>
                )}
              </section>

              {/* Perjalanan Pemulihan — sub-tab Grafik/Kalender/Perkembangan + perluas */}
              <section
                id="grafik-pemulihan"
                aria-label="Perjalanan pemulihan"
                className="hafta-card scroll-mt-24 p-4 sm:p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="inline-flex items-center gap-1.5 text-base font-semibold tracking-tight text-foreground">
                    <TrendingUp className="h-3.5 w-3.5 text-[var(--hafta-300)]" />
                    Perjalanan Pemulihan
                  </h2>
                  <button
                    type="button"
                    aria-label="Perluas Perjalanan Pemulihan"
                    title="Perluas"
                    onClick={() => setWorkspaceExpanded(true)}
                    className="tap-target flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-2">
                  <RecoveryWorkspace
                    sessions={sessions}
                    selectedRecordId={selectedRecord.id}
                    onSelectRecord={selectRecordById}
                    treatmentPlan={treatmentPlan}
                    homeProgram={homeProgram}
                    onProgramOpen={() => setProgramOpen(true)}
                  />
                </div>
              </section>

              {homeProgram && homeProgram.items.length > 0 ? (
                <section
                  aria-label="Program latihan mandiri"
                  className="rounded-[28px] border border-border bg-card p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-bold tracking-tight text-foreground">Latihan Mandiri</h2>
                    <button
                      type="button"
                      onClick={() => setProgramOpen(true)}
                      className="tap-target inline-flex min-h-9 cursor-pointer items-center gap-1 rounded-full text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
                    >
                      Semua
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <ul className="mt-2 flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {homeProgram.items.map((item, index) => (
                      <li
                        key={item.id}
                        className={cn(
                          'flex w-28 shrink-0 flex-col justify-between gap-2 rounded-2xl p-3',
                          ['bg-[#FEF9C3]', 'bg-[#E0F2FE]', 'bg-[#DCFCE7]'][index % 3],
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/70 text-[#422006]"
                        >
                          <Dumbbell className="h-3.5 w-3.5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[11px] font-semibold text-[#422006]">{item.name}</span>
                          <span className="block truncate text-[10px] font-medium text-[#713F12]/70">
                            {item.sets
                              ? `${item.sets} set × ${item.repetitions ?? ''} rep`
                              : (item.frequencyText ?? '')}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </aside>
          </div>

          {/* Perjalanan Pemulihan versi diperluas — modal global. */}
          <GlobalModal
            isOpen={workspaceExpanded}
            onClose={() => setWorkspaceExpanded(false)}
            title="Perjalanan Pemulihan"
            size="lg"
            className="sm:max-w-4xl"
          >
            <RecoveryWorkspace
              sessions={sessions}
              selectedRecordId={selectedRecord.id}
              onSelectRecord={selectRecordById}
              treatmentPlan={treatmentPlan}
              homeProgram={homeProgram}
              onProgramOpen={() => setProgramOpen(true)}
            />
          </GlobalModal>
          {patient?.therapistNote ? (
            <section className="hafta-card p-4 sm:p-5">
              <h3 className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <PenLine className="h-3.5 w-3.5 text-[var(--hafta-300)]" />
                Catatan Fisioterapis
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground">{patient.therapistNote}</p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {patient.therapistNoteAuthor ?? patient.therapistName ?? 'Fisioterapis Hafta'}
                {patient.therapistNoteAt ? ` · ${shortDate(patient.therapistNoteAt)}` : ''}
              </p>
            </section>
          ) : null}
        </>
      ) : activeTab === 'kunjungan' ? (
        <section className="hafta-card p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <CalendarDays className="h-3 w-3 text-[var(--hafta-300)]" />
                Kunjungan
              </p>
              <h2 className="text-balance mt-1 text-lg font-semibold tracking-tight text-foreground">
                Riwayat Kunjungan
              </h2>
            </div>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{visitRecords.length} sesi</span>
          </div>

          <ul className="mt-2 divide-y divide-border/70">
            {visibleVisits.map((record) => (
              <li key={record.id}>
                <button
                  type="button"
                  onClick={() => openSession(record)}
                  className="flex w-full cursor-pointer items-center gap-3 touch-manipulation py-3 text-left transition-colors focus-visible:border-[var(--hafta-950)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
                >
                  <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-[var(--hafta-50)]">
                    <span className="text-sm font-semibold leading-none tabular-nums text-foreground">
                      {record.recordedAt.getDate()}
                    </span>
                    <span className="mt-0.5 text-xs text-muted-foreground">
                      {record.recordedAt.toLocaleDateString('id-ID', { month: 'short' })}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      Sesi {visitNumberById.get(record.id) ?? 0}
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                        {record.therapistName ?? 'Fisioterapis Hafta'}
                      </span>
                      {amendedRevisionByRecordId.get(record.id) ? (
                        <span className="ml-1.5 rounded-full border border-[var(--hafta-org-200)] bg-[var(--hafta-org-50)] px-1.5 py-0.5 text-xs font-semibold text-[var(--hafta-org-700)]">
                          Diperbarui R{amendedRevisionByRecordId.get(record.id)} · Amandemen
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 flex flex-wrap gap-x-2.5 text-xs tabular-nums text-muted-foreground">
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
        <section className="hafta-card p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Stethoscope className="h-3 w-3 text-[var(--hafta-300)]" />
                Diagnosis
              </p>
              <h2 className="text-balance mt-1 text-lg font-semibold tracking-tight text-foreground">
                Diagnosis &amp; Anamnesis
              </h2>
            </div>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{visitRecords.length} catatan</span>
          </div>

          {/* Banner ringkasan: hanya bila ada isinya — kotak kosong tidak pernah dirender. */}
          {selectedRecord?.diagnosis ||
          patient?.therapyDiagnosisLabel ||
          treatmentPlan?.goals ||
          patient?.therapyGoal ? (
            <div className="mt-3 rounded-2xl border border-[var(--hafta-200)] bg-[var(--hafta-50)]/70 p-4">
              <p className="text-xs font-medium text-[var(--hafta-700)]">Kondisi &amp; Target Terapi Anda</p>
              <div className="mt-2 grid gap-4 sm:grid-cols-2">
                {selectedRecord?.diagnosis || patient?.therapyDiagnosisLabel ? (
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[var(--hafta-800)]">Diagnosis terkini</p>
                    <p className="text-balance mt-0.5 whitespace-pre-wrap text-base leading-relaxed text-foreground">
                      {selectedRecord?.diagnosis || patient?.therapyDiagnosisLabel}
                    </p>
                  </div>
                ) : null}
                {treatmentPlan?.goals || patient?.therapyGoal ? (
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[var(--hafta-800)]">Tujuan terapi</p>
                    <p className="text-balance mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                      {treatmentPlan?.goals || patient?.therapyGoal}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Riwayat diagnosis per kunjungan — teks tidak pernah dipotong. */}
          <ul className="mt-4">
            {visibleDiagnosis.map((record) => {
              const painValue = Number(record.painScore ?? 0);
              const painTone = metricTone('pain', painValue);
              const functionValue = Number(record.functionScore ?? 0);
              const functionTone = metricTone('function', functionValue);
              return (
                <li key={record.id} className="border-t border-border/70 py-4 first:border-t-0 first:pt-0 last:pb-0">
                  {/* header kunjungan */}
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-foreground">
                        <span>Sesi {visitNumberById.get(record.id) ?? 0}</span>
                        <span className="font-normal tabular-nums text-muted-foreground">
                          {shortDate(record.recordedAt)}
                        </span>
                        {record.amendedFromId ? (
                          <span className="rounded-full border border-[var(--hafta-org-200)] bg-[var(--hafta-org-50)] px-1.5 py-0.5 text-xs font-semibold text-[var(--hafta-org-700)]">
                            Revisi R{record.revisionNumber ?? 2}
                          </span>
                        ) : null}
                        <span
                          className={cn(
                            'rounded-full px-1.5 py-0.5 text-xs font-semibold',
                            record.status === 'FINALIZED' ? TONE_PILL.good : 'bg-secondary/60 text-muted-foreground',
                          )}
                        >
                          {labelRecordStatus(record.status)}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {record.therapistName ?? 'Fisioterapis Hafta'}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => openSession(record)}>
                      Lihat Detail Sesi
                    </Button>
                  </div>

                  {/* dua blok informasi — bahasa ramah pasien */}
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div className="border-l-2 border-[var(--hafta-300)] pl-3">
                      <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--hafta-700)]">
                        <Stethoscope className="h-3 w-3" />
                        Diagnosis Fisioterapi
                      </p>
                      <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                        Kesimpulan kondisi gerak &amp; fungsi dari fisioterapis
                      </p>
                      <p className="mt-1.5 whitespace-pre-wrap text-base leading-relaxed text-foreground">
                        {record.diagnosis || 'Tidak dicatat'}
                      </p>
                    </div>
                    <div className="border-l-2 border-[var(--hafta-300)] pl-3">
                      <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--hafta-700)]">
                        <NotebookPen className="h-3 w-3" />
                        Keluhan &amp; Anamnesis
                      </p>
                      <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                        Keluhan dan riwayat yang dicatat saat awal sesi
                      </p>
                      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                        {record.anamnesis || 'Anamnesis tidak dicatat'}
                      </p>
                    </div>
                  </div>

                  {/* footer indikator kunci sesi */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
                        TONE_PILL[painTone.tone],
                      )}
                    >
                      Nyeri {painValue}/10 · {painTone.label}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
                        TONE_PILL[functionTone.tone],
                      )}
                    >
                      Fungsi {functionValue}/10 · {functionTone.label}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>

          <PaginationBar
            page={safeDiagnosisPage}
            pageCount={clinicalPageCount}
            pageSize={6}
            onPageChange={setDiagnosisPage}
          />
        </section>
      ) : activeTab === 'tindakan' ? (
        <section className="hafta-card p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <HeartPulse className="h-3 w-3 text-[var(--hafta-300)]" />
                Tindakan
              </p>
              <h2 className="text-balance mt-1 text-lg font-semibold tracking-tight text-foreground">
                Tindakan &amp; Pemeriksaan
              </h2>
            </div>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{visitRecords.length} sesi</span>
          </div>

          {/* Rencana intervensi aktif — gambaran besar terapi yang sedang dijalani. */}
          {treatmentPlan ? (
            <div className="mt-3 rounded-2xl border border-[var(--hafta-200)] bg-[var(--hafta-50)]/70 p-4">
              <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--hafta-700)]">
                <ClipboardList className="h-3 w-3" />
                Rencana Intervensi Aktif
              </p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[var(--hafta-800)]">Intervensi utama</p>
                  <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {treatmentPlan.interventions}
                  </p>
                </div>
                {treatmentPlan.precautions ? (
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[var(--hafta-800)]">Perhatian &amp; pencegahan</p>
                    <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-[var(--hafta-red-700)]">
                      {treatmentPlan.precautions}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Timeline tindakan per sesi — langkah berurutan agar mudah dipahami. */}
          <ul className="mt-4">
            {visibleTindakan.map((record) => {
              const painValue = Number(record.painScore ?? 0);
              const romValue = Number(record.rangeOfMotionScore ?? 0);
              return (
                <li key={record.id} className="border-t border-border/70 py-4 first:border-t-0 first:pt-0 last:pb-0">
                  {/* header sesi */}
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-foreground">
                        <span>Sesi {visitNumberById.get(record.id) ?? 0}</span>
                        <span className="font-normal tabular-nums text-muted-foreground">
                          {shortDate(record.recordedAt)}
                        </span>
                        {record.amendedFromId ? (
                          <span className="rounded-full border border-[var(--hafta-org-200)] bg-[var(--hafta-org-50)] px-1.5 py-0.5 text-xs font-semibold text-[var(--hafta-org-700)]">
                            Revisi R{record.revisionNumber ?? 2}
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {record.therapistName ?? 'Fisioterapis Hafta'}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-secondary/60 px-2 py-0.5 text-xs font-semibold tabular-nums text-foreground">
                        Nyeri {painValue}/10
                      </span>
                      <span className="rounded-full bg-secondary/60 px-2 py-0.5 text-xs font-semibold tabular-nums text-foreground">
                        ROM {romValue}/10
                      </span>
                    </div>
                  </div>

                  {/* langkah-langkah tindakan — timeline bernomor dengan garis penghubung */}
                  <ol className="mt-3">
                    {[
                      {
                        label: 'Pemeriksaan Fisik',
                        hint: 'Kondisi fisik & gerak yang diperiksa terapis',
                        value: record.physicalExamination,
                        empty: 'Tidak ada catatan khusus',
                      },
                      {
                        label: 'Tindakan Fisioterapi',
                        hint: 'Terapi, latihan, atau modalitas yang diberikan pada sesi ini',
                        value: record.treatment,
                        empty: 'Tindakan tidak dicatat',
                      },
                      {
                        label: 'Evaluasi & Tindak Lanjut',
                        hint: 'Hasil setelah diterapi dan hal yang perlu dilakukan sebelum sesi berikutnya',
                        value:
                          [record.evaluation, record.followUpPlan]
                            .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
                            .join('\n\n') || null,
                        empty: 'Belum ada catatan tindak lanjut',
                      },
                    ].map((step, index, steps) => (
                      <li key={step.label} className="grid grid-cols-[28px_minmax(0,1fr)] gap-x-3">
                        <div className="flex flex-col items-center" aria-hidden="true">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--hafta-300)] text-xs font-bold tabular-nums text-[#181700]">
                            {index + 1}
                          </span>
                          {index < steps.length - 1 ? <span className="my-1 w-px flex-1 bg-border" /> : null}
                        </div>
                        <div className={cn('min-w-0', index < steps.length - 1 ? 'pb-4' : null)}>
                          <p className="text-sm font-semibold text-foreground">{step.label}</p>
                          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{step.hint}</p>
                          <p
                            className={cn(
                              'mt-1 whitespace-pre-wrap text-sm leading-relaxed',
                              step.value ? 'text-foreground' : 'text-muted-foreground',
                            )}
                          >
                            {step.value ?? step.empty}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>

                  {/* aksi cepat per sesi */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openSession(record)}>
                      Lihat Detail Sesi
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPrintRecord(record)}>
                      <Printer />
                      Cetak/Unduh
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>

          <PaginationBar
            page={safeTindakanPage}
            pageCount={clinicalPageCount}
            pageSize={6}
            onPageChange={setTindakanPage}
          />
        </section>
      ) : (
        <section className="hafta-card p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <FileText className="h-3 w-3 text-[var(--hafta-300)]" />
                Dokumen
              </p>
              <h2 className="text-balance mt-1 text-lg font-semibold tracking-tight text-foreground">
                Berkas Rekam Medis
              </h2>
            </div>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{records.length} berkas</span>
          </div>
          <ul className="mt-2 divide-y divide-border/70">
            {visibleDocs.map((record) => (
              <li key={record.id} className="flex items-center gap-3 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--hafta-50)] text-muted-foreground">
                  <FileText className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {record.amendedFromId
                      ? `Revisi R${record.revisionNumber ?? 2} · Pembaruan Sesi ${visitNumberById.get(record.id) ?? 0}`
                      : `Rekam medis sesi ${visitNumberById.get(record.id) ?? 0}`}
                  </span>
                  <span className="block text-xs tabular-nums text-muted-foreground">
                    {shortDate(record.recordedAt)} · {labelRecordStatus(record.status)}
                  </span>
                </span>
                <Button variant="outline" size="sm" onClick={() => setPrintRecord(record)}>
                  <Printer />
                  Cetak/Unduh
                </Button>
              </li>
            ))}
          </ul>

          <PaginationBar
            page={safeDocsPage}
            pageCount={docsPageCount}
            pageSize={docsPerPage}
            pageSizeOptions={[6, 12, 24]}
            onPageChange={setDocsPage}
            onPageSizeChange={(size) => {
              setDocsPerPage(size);
              setDocsPage(1);
            }}
          />
        </section>
      )}

      {/* ── SLIDE-OVER: detail evaluasi per kunjungan ── */}
      <GlobalSlideOver
        isOpen={detailRecord !== null}
        onClose={() => setDetailRecord(null)}
        icon={<Stethoscope className="h-4 w-4" />}
        title={detailRecord ? `Evaluasi Terapi · Sesi ${visitNumberById.get(detailRecord.id) ?? 1}` : 'Evaluasi Terapi'}
        subtitle={detailRecord ? longDate(detailRecord.recordedAt) : undefined}
        badge={
          detailRecord ? (
            <>
              {detailRecord.amendedFromId ? (
                <span className="rounded-full border border-[var(--hafta-org-200)] bg-[var(--hafta-org-50)] px-2 py-0.5 text-xs font-semibold text-[var(--hafta-org-700)]">
                  Revisi R{detailRecord.revisionNumber ?? 2} · Pembaruan data
                </span>
              ) : null}
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-semibold',
                  detailRecord.status === 'FINALIZED' ? TONE_PILL.good : 'bg-secondary/60 text-muted-foreground',
                )}
              >
                {labelRecordStatus(detailRecord.status)}
              </span>
            </>
          ) : undefined
        }
        size="md"
        footer={
          detailRecord ? (
            <Button variant="default" size="default" className="w-full" onClick={() => setPrintRecord(detailRecord)}>
              <Printer />
              Cetak/Unduh
            </Button>
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
                  <div key={key} className="hafta-tint p-3">
                    <div className="flex items-center justify-between gap-1">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        <Icon className="h-3 w-3 text-[var(--hafta-300)]" />
                        {label}
                      </span>
                      <span className={cn('rounded-full px-1.5 py-0.5 text-xs font-semibold', TONE_PILL[tone.tone])}>
                        {tone.label}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xl font-semibold leading-none tabular-nums text-foreground">
                      {value}
                      <span className="ml-0.5 text-xs font-normal text-muted-foreground">/10</span>
                    </p>
                  </div>
                );
              })}
            </div>

            <dl className="divide-y divide-border/70 border-y border-border/70">
              {CLINICAL_ROWS.map((row) => {
                const value = detailRecord[row.field];
                return (
                  <div
                    key={row.field}
                    className="grid gap-0.5 py-2 sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)] sm:gap-6"
                  >
                    <dt className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground sm:pt-px">
                      <row.icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-[var(--hafta-300)]" />
                      {row.label}
                    </dt>
                    <dd className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
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

            <p className="text-xs text-muted-foreground">
              Fisioterapis: {detailRecord.therapistName ?? 'Fisioterapis Hafta'}
            </p>
          </div>
        ) : null}
      </GlobalSlideOver>

      {/* ── MODAL GLOBAL: program latihan mandiri ── */}
      <GlobalModal
        isOpen={programOpen}
        onClose={() => setProgramOpen(false)}
        size="md"
        icon={<Dumbbell className="h-4 w-4" />}
        title="Program Latihan Mandiri"
        subtitle={
          homeProgram?.startsAt
            ? `${homeProgram.items.length} latihan · ${shortDate(homeProgram.startsAt)}${homeProgram.endsAt ? ` – ${shortDate(homeProgram.endsAt)}` : ''}`
            : `${homeProgram?.items.length ?? 0} latihan`
        }
      >
        {homeProgram ? (
          <ol className="divide-y divide-border/70">
            {homeProgram.items.map((item, index) => (
              <li key={item.id} className="flex gap-3 py-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full hafta-tint text-xs font-semibold tabular-nums text-[var(--hafta-700)]">
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">{item.name}</span>
                  <span className="mt-0.5 block whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                    {item.instruction}
                  </span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    {[
                      item.sets ? `${item.sets} set` : null,
                      item.repetitions ? `${item.repetitions} repetisi` : null,
                      item.durationSeconds ? `${item.durationSeconds} detik` : null,
                      item.frequencyText,
                    ]
                      .filter(Boolean)
                      .map((chip) => (
                        <span
                          key={chip}
                          className="rounded-full bg-secondary/60 px-2 py-0.5 text-xs font-medium text-foreground"
                        >
                          {chip}
                        </span>
                      ))}
                  </span>
                  {item.precaution ? (
                    <span className="mt-1 block text-xs leading-relaxed text-[var(--hafta-red-700)]">
                      Perhatian: {item.precaution}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ol>
        ) : null}
      </GlobalModal>

      {/* Pratinjau cetak/unduh — PDF.js global; print & unduh dari toolbar pdf.js. */}
      <MedicalRecordPrintDialog
        record={printRecord}
        open={printRecord !== null}
        onOpenChange={(open) => {
          if (!open) setPrintRecord(null);
        }}
      />
    </div>
  );
}
