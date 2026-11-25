'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Dumbbell,
  FileText,
  HeartPulse,
  NotebookPen,
  PenLine,
  Printer,
  Stethoscope,
  TrendingUp,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { GlobalModal } from '@/components/ui/global-modal';
import { GlobalSlideOver } from '@/components/ui/global-slide-over';
import { Button } from '@/components/ui/button';
import { MedicalRecordPrintDialog } from '@/components/pdf/medical-record-print-dialog';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { TherapyCalendar } from '@/components/patient/therapy-calendar';
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
  /** Petunjuk arah skala agar pasien paham ke mana angka yang baik. */
  hint: string;
}[] = [
  { key: 'pain', label: 'Nyeri', short: 'Nyeri', field: 'painScore', icon: HeartPulse, hint: 'makin rendah makin baik' },
  { key: 'rom', label: 'Rentang Gerak', short: 'ROM', field: 'rangeOfMotionScore', icon: Activity, hint: 'makin tinggi makin baik' },
  { key: 'strength', label: 'Kekuatan', short: 'Kekuatan', field: 'strengthScore', icon: TrendingUp, hint: 'makin tinggi makin baik' },
  { key: 'function', label: 'Fungsi', short: 'Fungsi', field: 'functionScore', icon: Activity, hint: 'makin tinggi makin baik' },
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

/** Warna isi jalur skor 0–10 pada tile Kondisi Terkini (mengikuti nada hasil). */
const TONE_TRACK: Record<Tone, string> = {
  good: 'bg-[var(--hafta-grn-500)]',
  watch: 'bg-[var(--hafta-300)]',
  alert: 'bg-[var(--hafta-red-500)]',
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

const shortWeekday = (value: Date) => value.toLocaleDateString('id-ID', { weekday: 'short' });
const dayNumber = (value: Date) => value.toLocaleDateString('id-ID', { day: 'numeric' });
const monthYear = (value: Date) => value.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
const clockTime = (value: Date) =>
  value.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');

function formatAge(dateOfBirth: Date | null) {
  if (!dateOfBirth) return '—';
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

/* ── Grafik Pemulihan Klinis (recharts) ─────────────────────────── */

type ChartPoint = { sesi: number; label: string; date: string; pain: number; rom: number };

function ChartBadge({
  cx,
  cy,
  payload,
  onSelect,
}: {
  cx?: number;
  cy?: number;
  payload?: ChartPoint;
  onSelect?: (sesi: number) => void;
}) {
  if (typeof cx !== 'number' || typeof cy !== 'number' || !payload) return null;
  const isLast = payload.sesi === 9;
  return (
    <g
      data-chart-dot={payload.sesi}
      onClick={() => onSelect?.(payload.sesi)}
      style={onSelect ? { cursor: 'pointer' } : undefined}
    >
      {/* area sentuh lebih besar agar mudah diklik di layar sentuh */}
      <circle cx={cx} cy={cy} r={14} fill="transparent" />
      {isLast ? <circle cx={cx} cy={cy} r={9} fill="var(--hafta-300)" opacity={0.25} /> : null}
      <circle cx={cx} cy={cy} r={4.5} fill="#fff" stroke="var(--hafta-400)" strokeWidth={2} />
      <g transform={`translate(${cx - 16}, ${cy - 30})`}>
        <rect
          width={32}
          height={18}
          rx={9}
          fill={isLast ? 'var(--hafta-900)' : '#fff'}
          stroke={isLast ? 'var(--hafta-900)' : 'var(--hafta-border)'}
          strokeWidth={1}
        />
        <text
          x={16}
          y={12.5}
          textAnchor="middle"
          fontSize={10}
          fontWeight={600}
          fill={isLast ? 'var(--hafta-50)' : 'var(--hafta-800)'}
        >
          {payload.pain}/10
        </text>
      </g>
    </g>
  );
}

function RomDot({
  cx,
  cy,
  payload,
  onSelect,
}: {
  cx?: number;
  cy?: number;
  payload?: ChartPoint;
  onSelect?: (sesi: number) => void;
}) {
  if (typeof cx !== 'number' || typeof cy !== 'number') return null;
  return (
    <g
      data-chart-dot={payload?.sesi ?? 0}
      onClick={() => onSelect?.(payload?.sesi ?? 0)}
      style={onSelect ? { cursor: 'pointer' } : undefined}
    >
      {/* area sentuh lebih besar agar mudah diklik di layar sentuh */}
      <circle cx={cx} cy={cy} r={14} fill="transparent" />
      <circle cx={cx} cy={cy} r={3.5} fill="var(--hafta-900)" />
    </g>
  );
}

function ChartTick({
  x,
  y,
  payload,
  length,
  dates,
  onSelect,
}: {
  x?: number;
  y?: number;
  payload?: { value: number };
  length: number;
  dates: Map<number, string>;
  onSelect?: (sesi: number) => void;
}) {
  if (typeof x !== 'number' || typeof y !== 'number' || !payload) return null;
  const sesi = Number(payload.value);
  const isLast = sesi === length;
  return (
    <g
      data-chart-dot={sesi}
      role="button"
      tabIndex={0}
      aria-label={`Lihat detail Sesi ${sesi}, ${dates.get(sesi) ?? ''}`}
      onClick={() => onSelect?.(sesi)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect?.(sesi);
        }
      }}
      style={{ cursor: 'pointer' }}
    >
      <title>{`Lihat detail Sesi ${sesi} — ${dates.get(sesi) ?? ''}`}</title>
      <rect x={x - 44} y={y} width={88} height={30} fill="transparent" />
      <text x={x} y={y + 10} textAnchor="middle" pointerEvents="none">
        <tspan x={x} dy={0} fontSize={10.5} fontWeight={isLast ? 700 : 500} fill="var(--hafta-800)">
          Sesi {sesi}
        </tspan>
        <tspan x={x} dy={12} fontSize={9.5} fill="var(--hafta-600)">
          {dates.get(sesi) ?? ''}
        </tspan>
      </text>
    </g>
  );
}

function RecoveryChart({ data, onSelectSession }: { data: ChartPoint[]; onSelectSession?: (sesi: number) => void }) {  const tickDates = useMemo(
    () => new Map(data.map((point) => [point.sesi, point.date])),
    [data],
  );
  const tickInterval = data.length > 5 ? 2 : 0;

  /**
   * Klik di mana pun pada grafik memilih sesi terdekat.
   * Posisi sesi dibaca dari titik-titik yang sudah dirender, sehingga
   * pemetaan selalu akurat (fallback activeTooltipIndex milik recharts
   * bisa basi dan meleset ke sesi lain).
   */
  const handleSurfaceClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!onSelectSession) return;
    if ((event.target as Element).closest('[data-chart-dot]')) return; // dot/tick punya handler sendiri
    const svg = event.currentTarget.querySelector('svg');
    if (!svg) return;
    // Ambil satu titik acuan per sesi (titik nyeri), bukan gabungan dua garis.
    const centers = Array.from(svg.querySelectorAll('[data-chart-dot] circle[r="14"]'))
      .map((circle) => circle.getBoundingClientRect())
      .filter((rect) => rect.width > 0)
      .map((rect) => Math.round(rect.x + rect.width / 2));
    const uniqueX = Array.from(new Set(centers)).sort((a, b) => a - b);
    if (uniqueX.length === 0) return;
    const clickedX = event.clientX;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    uniqueX.forEach((x, index) => {
      const distance = Math.abs(x - clickedX);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });
    onSelectSession(Math.min(nearestIndex + 1, data.length));
  };

  return (
    <div
      className="h-[220px] w-full sm:h-[260px]"
      onClick={handleSurfaceClick}
      style={{
        cursor: onSelectSession ? 'pointer' : undefined,
        touchAction: onSelectSession ? 'manipulation' : undefined,
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 28, right: 8, bottom: 8, left: -18 }}>
          <CartesianGrid vertical={false} stroke="var(--hafta-100)" strokeDasharray="4 6" />
          <YAxis yAxisId="pain" domain={[0, 10]} tickLine={false} axisLine={false} tick={false} />
          <YAxis yAxisId="rom" orientation="right" domain={[0, 100]} tickLine={false} axisLine={false} tick={false} />
          <XAxis
            dataKey="sesi"
            type="number"
            domain={[1, data.length]}
            tickLine={false}
            axisLine={false}
            interval={tickInterval}
            tick={(props: { x?: number; y?: number; payload?: { value: number } }) => (
              <ChartTick {...props} length={data.length} dates={tickDates} onSelect={onSelectSession} />
            )}
          />
          <Line
            yAxisId="rom"
            type="monotone"
            dataKey="rom"
            stroke="var(--hafta-900)"
            strokeWidth={1.75}
            strokeDasharray="6 5"
            dot={<RomDot onSelect={onSelectSession} />}
            activeDot={<RomDot onSelect={onSelectSession} />}
            isAnimationActive={false}
          />
          <Line
            yAxisId="pain"
            type="monotone"
            dataKey="pain"
            stroke="var(--hafta-400)"
            strokeWidth={2.5}
            dot={<ChartBadge onSelect={onSelectSession} />}
            activeDot={<ChartBadge onSelect={onSelectSession} />}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Grafik di-memo agar panel detail bisa dibuka tanpa re-render grafik. */
const MemoRecoveryChart = memo(RecoveryChart);
const MemoTherapyCalendar = memo(TherapyCalendar);

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
  /** Pratinjau cetak/unduh via PDF.js global (MedicalRecordPrintDialog). */
  const [printRecord, setPrintRecord] = useState<TherapyProgressView | null>(null);
  const [programOpen, setProgramOpen] = useState(false);
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

  const previousRecord = useMemo(() => {
    if (!selectedRecord) return null;
    const index = chronological.findIndex((record) => record.id === selectedRecord.id);
    return index > 0 ? chronological[index - 1] : null;
  }, [chronological, selectedRecord]);

  const visitNumberById = useMemo(
    () => new Map(chronological.map((record, index) => [record.id, index + 1])),
    [chronological],
  );

  /** Satu sumber aksi untuk grafik, kalender, dan daftar kunjungan. */
  const openSession = useCallback((record: TherapyProgressView) => {
    setSelectedRecordId(record.id);
    setDetailRecord(record);
  }, []);

  const latestRecord = records[0] ?? null;
  const firstRecord = chronological[0] ?? null;

  const chartData = useMemo<ChartPoint[]>(
    () =>
      chronological.map((record, index) => ({
        sesi: index + 1,
        label: `Sesi ${index + 1}`,
        date: shortDate(record.recordedAt),
        pain: Number(record.painScore),
        rom: Number(record.rangeOfMotionScore) * 10,
      })),
    [chronological],
  );
  const latestChartPoint = chartData.length > 0 ? chartData[chartData.length - 1] : null;

  const calendarEntries = useMemo(
    () =>
      chronological.map((record) => ({
        id: record.id,
        recordedAt: new Date(record.recordedAt),
        painScore: record.painScore ?? null,
        rangeOfMotionScore: record.rangeOfMotionScore ?? null,
        status: record.status,
      })),
    [chronological],
  );

  const selectSessionByNumber = useCallback(
    (sesi: number) => {
      const record = chronological[sesi - 1];
      if (record) openSession(record);
    },
    [chronological, openSession],
  );

  const selectCalendarRecord = useCallback(
    (recordId: string) => {
      const record = records.find((item) => item.id === recordId);
      if (record) openSession(record);
    },
    [records, openSession],
  );
  const visitPageCount = Math.max(1, Math.ceil(records.length / visitsPerPage));
  const safeVisitPage = Math.min(visitPage, visitPageCount);
  const visibleVisits = records.slice((safeVisitPage - 1) * visitsPerPage, safeVisitPage * visitsPerPage);
  const docsPageCount = Math.max(1, Math.ceil(records.length / docsPerPage));
  const safeDocsPage = Math.min(docsPage, docsPageCount);
  const visibleDocs = records.slice((safeDocsPage - 1) * docsPerPage, safeDocsPage * docsPerPage);
  /** Diagnosis & tindakan: 6 baris per halaman agar tidak memanjang. */
  const clinicalPageCount = Math.max(1, Math.ceil(records.length / 6));
  const safeDiagnosisPage = Math.min(diagnosisPage, clinicalPageCount);
  const safeTindakanPage = Math.min(tindakanPage, clinicalPageCount);
  const visibleDiagnosis = records.slice((safeDiagnosisPage - 1) * 6, safeDiagnosisPage * 6);
  const visibleTindakan = records.slice((safeTindakanPage - 1) * 6, safeTindakanPage * 6);
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
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-4">
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
              <dt className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground sm:text-[10px]">
                {item.label}
              </dt>
              <dd
                className={cn(
                  'mt-0.5 truncate text-[13px] font-medium text-foreground',
                  item.tabular && 'tabular-nums',
                )}
              >
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
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
            // Detail harus konsisten dengan value: tanggal hanya tampil bila
            // jadwal benar-benar ada; tanpa jadwal jangan menampilkan frekuensi
            // seolah-olah sudah terjadwal.
            detail: patient?.nextTherapyAt
              ? (patient.therapyFrequencyText ?? 'jadwal terapi terdekat')
              : 'belum dijadwalkan',
          },
        ].map((stat) => (
          <div key={stat.label} className="hafta-card p-2.5 sm:p-3.5">
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
        <div className="flex flex-col items-center hafta-card py-12 text-center">
          <Activity className="h-6 w-6 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold text-foreground">Belum ada rekam medis</p>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
            Catatan evaluasi akan tampil setelah fisioterapis menyelesaikan sesi dan membagikannya.
          </p>
        </div>
      ) : activeTab === 'ringkasan' && selectedRecord ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <div className="min-w-0 space-y-4">
          {/* 1. metrik ringkas — paling atas agar langsung terbaca semua umur */}
          <section className="hafta-card p-4 sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  <Activity className="h-3 w-3 text-[var(--hafta-300)]" />
                  Kondisi Terkini
                </p>
                <h2 className="mt-1 text-[15px] font-semibold tracking-tight text-foreground sm:text-base">
                  Evaluasi Sesi {visitNumberById.get(selectedRecord.id) ?? 1}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">{longDate(selectedRecord.recordedAt)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
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
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setPrintRecord(selectedRecord)}
                >
                  <Printer />
                  Cetak/Unduh
                </Button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
              {METRICS.map(({ key, label, short, field, icon: Icon, hint }) => {
                const value = Number(selectedRecord[field] ?? 0);
                const previous = previousRecord ? Number(previousRecord[field] ?? 0) : null;
                const change = deltaForMetric(key, value, previous);
                const tone = metricTone(key, value);
                return (
                  <div key={key} className="hafta-tint p-3">
                    <div className="flex items-center justify-between gap-1">
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                        <Icon className="h-3 w-3 text-[var(--hafta-300)]" />
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
                    {/* Jalur skor 0–10 — pasien langsung melihat posisi nilai
                        terhadap skala penuh, diwarnai sesuai nada hasil. */}
                    <div className="mt-2.5">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200/70">
                        <div
                          className={cn('h-full rounded-full', TONE_TRACK[tone.tone])}
                          style={{ width: `${Math.max(4, value * 10)}%` }}
                        />
                      </div>
                      <div className="mt-1 flex justify-between font-mono text-[9px] tabular-nums text-muted-foreground">
                        <span>0</span>
                        <span>10</span>
                      </div>
                    </div>
                    <p className="mt-1 text-[9px] leading-snug text-muted-foreground">{hint}</p>
                    <p className="sr-only">
                      {short} sesi ini {value} dari 10. Skor {hint}.
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 2. grafik pemulihan klinis */}
          {chartData.length >= 2 ? (
            <section className="hafta-card p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    <TrendingUp className="h-3 w-3 text-[var(--hafta-300)]" />
                    Grafik Pemulihan Klinis
                  </p>
                  <h2 className="mt-1 text-[15px] font-semibold tracking-tight text-foreground sm:text-base">
                    Penurunan Nyeri (VAS 0–10) &amp; Kenaikan Gerak (ROM %)
                  </h2>
                </div>
                <div className="flex items-center gap-3 text-[10.5px] font-medium text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--hafta-400)]" />
                    Nyeri VAS
                    {latestChartPoint ? (
                      <span className="font-semibold tabular-nums text-foreground">
                        {latestChartPoint.pain}/10
                      </span>
                    ) : null}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      style={{ width: 16, height: 0, borderTop: '2px dashed var(--hafta-900)' }}
                    />
                    ROM
                    {latestChartPoint ? (
                      <span className="font-semibold tabular-nums text-foreground">
                        {latestChartPoint.rom}%
                      </span>
                    ) : null}
                  </span>
                </div>
              </div>
              <div className="mt-3">
                <MemoRecoveryChart data={chartData} onSelectSession={selectSessionByNumber} />
              </div>
            </section>
          ) : (
            <section className="hafta-card p-4 sm:p-5">
              <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-[var(--hafta-300)]" />
                Grafik Pemulihan Klinis
              </p>
              <h2 className="mt-1 text-[15px] font-semibold tracking-tight text-foreground sm:text-base">
                Penurunan Nyeri (VAS 0–10) &amp; Kenaikan Gerak (ROM %)
              </h2>
              <div className="mt-3 flex items-start gap-3 rounded-2xl border border-dashed border-border bg-[var(--hafta-50)]/60 p-4">
                <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-[var(--hafta-300)]" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">
                    Grafik mulai tampil setelah 2 evaluasi
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                    Setelah sesi berikutnya selesai dinilai, garis progres nyeri dan gerak Anda akan
                    tampil di sini sehingga perkembangan terlihat jelas dari waktu ke waktu.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* 3. kalender terapi */}
          {records.length > 0 ? (
            <section className="hafta-card p-4 sm:p-5">
              <MemoTherapyCalendar entries={calendarEntries} onSelectRecord={selectCalendarRecord} />
            </section>
          ) : null}

          {/* 4. catatan klinis sesi terpilih */}
          <section className="hafta-card p-4 sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h2 className="inline-flex items-center gap-1.5 text-[15px] font-semibold tracking-tight text-foreground">
                  <NotebookPen className="h-3.5 w-3.5 text-[var(--hafta-300)]" />
                  Perkembangan Terapi
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {longDate(selectedRecord.recordedAt)} · Sesi {visitNumberById.get(selectedRecord.id) ?? 1}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
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
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setPrintRecord(selectedRecord)}
                >
                  <Printer />
                  Cetak/Unduh
                </Button>
              </div>
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
                <h3 className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <ClipboardList className="h-3.5 w-3.5 text-[var(--hafta-300)]" />
                  Rencana Terapi
                </h3>
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

            {/* program latihan — compact, detail di modal */}
            {homeProgram && homeProgram.items.length > 0 ? (
              <div className="mt-4 border-t border-border/70 pt-3">
                <button
                  type="button"
                  onClick={() => setProgramOpen(true)}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-1 py-2 text-left transition-colors hover:bg-[var(--hafta-50)] focus-visible:border-[var(--hafta-950)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl hafta-tint text-[var(--hafta-700)]">
                    <Dumbbell className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] font-semibold text-foreground">
                      Program Latihan Mandiri
                    </span>
                    <span className="block text-[10.5px] text-muted-foreground">
                      {homeProgram.items.length} latihan ·{' '}
                      {homeProgram.startsAt
                        ? `${shortDate(homeProgram.startsAt)}${homeProgram.endsAt ? ` – ${shortDate(homeProgram.endsAt)}` : ''}`
                        : 'tanpa batas waktu'}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              </div>
            ) : null}
          </section>

          {/* catatan fisioterapis — hanya bila ada */}
          {patient?.therapistNote ? (
            <section className="hafta-card p-4 sm:p-5">
              <h3 className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <PenLine className="h-3.5 w-3.5 text-[var(--hafta-300)]" />
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

          {/* ── rail kanan (desktop) — pola patient portal: terapi berikutnya + aksi ── */}
          <aside className="hidden space-y-4 lg:sticky lg:top-[88px] lg:block">
            <section className="hafta-card overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b border-border/70 px-4 py-3">
                <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  <CalendarDays className="h-3 w-3 text-[var(--hafta-300)]" />
                  Terapi Berikutnya
                </p>
                {patient?.nextTherapyAt ? (
                  <span className="rounded-full bg-[var(--hafta-50)] px-2 py-0.5 text-[10px] font-semibold text-[var(--hafta-700)]">
                    Terjadwal
                  </span>
                ) : null}
              </div>

              <div className="px-4 py-4">
                {patient?.nextTherapyAt ? (
                  <div className="flex items-start gap-3">
                    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-[var(--hafta-900)] text-white">
                      <span className="text-[9.5px] font-medium uppercase tracking-wide text-white/65">
                        {shortWeekday(patient.nextTherapyAt)}
                      </span>
                      <span className="text-xl font-semibold leading-tight tabular-nums">
                        {dayNumber(patient.nextTherapyAt)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold capitalize text-foreground">
                        {monthYear(patient.nextTherapyAt)}
                      </p>
                      <p className="mt-0.5 text-[12.5px] font-medium tabular-nums text-muted-foreground">
                        {clockTime(patient.nextTherapyAt)} WIB
                      </p>
                      <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                        <Stethoscope className="h-3 w-3 shrink-0" />
                        <span className="truncate">
                          {patient?.therapistName ?? latestRecord?.therapistName ?? 'Fisioterapis Hafta'}
                        </span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-[12.5px] text-muted-foreground">Belum ada jadwal terapi berikutnya.</p>
                )}

                {patient?.therapyFrequencyText ? (
                  <p className="mt-3 rounded-xl bg-[var(--hafta-50)] px-3 py-2 text-[11.5px] text-[var(--hafta-800)]">
                    {patient.therapyFrequencyText}
                  </p>
                ) : null}

                <Link
                  href="/dashboard/appointments"
                  className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-[var(--hafta-950)] text-[12px] font-semibold text-white transition-colors hover:bg-[var(--hafta-900)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
                >
                  Lihat jadwal
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </section>

            <section className="hafta-card p-4">
              <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <FileText className="h-3 w-3 text-[var(--hafta-300)]" />
                Dokumen Sesi Ini
              </p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
                Cetak atau simpan ringkasan sesi {visitNumberById.get(selectedRecord.id) ?? 1} sebagai PDF.
              </p>
              <div className="mt-3">
                <Button
                  variant="default"
                  size="xs"
                  className="w-full"
                  onClick={() => setPrintRecord(selectedRecord)}
                >
                  <Printer />
                  Cetak/Unduh
                </Button>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('dokumen')}
                className="mt-2 flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-2 py-2 text-[11.5px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
              >
                Semua dokumen ({records.length})
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </section>
          </aside>
        </div>
      ) : activeTab === 'kunjungan' ? (
        <section className="hafta-card p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <CalendarDays className="h-3 w-3 text-[var(--hafta-300)]" />
                Kunjungan
              </p>
              <h2 className="mt-1 text-[15px] font-semibold tracking-tight text-foreground">Riwayat Kunjungan</h2>
            </div>
            <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{records.length} sesi</span>
          </div>

          <ul className="mt-2 divide-y divide-border/70">
            {visibleVisits.map((record) => (
              <li key={record.id}>
                <button
                  type="button"
                  onClick={() => openSession(record)}
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
        <section className="hafta-card p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <Stethoscope className="h-3 w-3 text-[var(--hafta-300)]" />
                Diagnosis
              </p>
              <h2 className="mt-1 text-[15px] font-semibold tracking-tight text-foreground">Diagnosis &amp; Anamnesis</h2>
            </div>
            <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
              {records.length} catatan
            </span>
          </div>
          <ul className="mt-2 divide-y divide-border/70">
            {visibleDiagnosis.map((record) => (
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
              <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <HeartPulse className="h-3 w-3 text-[var(--hafta-300)]" />
                Tindakan
              </p>
              <h2 className="mt-1 text-[15px] font-semibold tracking-tight text-foreground">Tindakan &amp; Pemeriksaan</h2>
            </div>
            <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
              {records.length} sesi
            </span>
          </div>
          <ul className="mt-2 divide-y divide-border/70">
            {visibleTindakan.map((record) => (
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
              <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <FileText className="h-3 w-3 text-[var(--hafta-300)]" />
                Dokumen
              </p>
              <h2 className="mt-1 text-[15px] font-semibold tracking-tight text-foreground">Berkas Rekam Medis</h2>
            </div>
            <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{records.length} berkas</span>
          </div>
          <ul className="mt-2 divide-y divide-border/70">
            {visibleDocs.map((record) => (
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
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setPrintRecord(record)}
                >
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
            <Button
              variant="default"
              size="xs"
              className="w-full"
              onClick={() => setPrintRecord(detailRecord)}
            >
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
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                        <Icon className="h-3 w-3 text-[var(--hafta-300)]" />
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
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full hafta-tint text-[10px] font-semibold tabular-nums text-[var(--hafta-700)]">
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold text-foreground">{item.name}</span>
                  <span className="mt-0.5 block whitespace-pre-wrap text-[11.5px] leading-relaxed text-muted-foreground">
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
                          className="rounded-full bg-secondary/60 px-2 py-0.5 text-[9.5px] font-medium text-foreground"
                        >
                          {chip}
                        </span>
                      ))}
                  </span>
                  {item.precaution ? (
                    <span className="mt-1 block text-[10px] leading-relaxed text-[var(--hafta-red-700)]">
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
