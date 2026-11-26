'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Activity,
  ArrowUpRight,
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
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { GlobalModal } from '@/components/ui/global-modal';
import { GlobalSlideOver } from '@/components/ui/global-slide-over';
import { Button } from '@/components/ui/button';
import { MedicalRecordPrintDialog } from '@/components/pdf/medical-record-print-dialog';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { TherapyCalendar } from '@/components/patient/therapy-calendar';
import { detectBodyRegions } from '@/components/patient/body-condition-map';
import { TherapyAnatomyStage } from '@/components/patient/therapy-anatomy-stage';
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
  {
    key: 'pain',
    label: 'Nyeri',
    short: 'Nyeri',
    field: 'painScore',
    icon: HeartPulse,
    hint: 'makin rendah makin baik',
  },
  {
    key: 'rom',
    label: 'Rentang Gerak',
    short: 'ROM',
    field: 'rangeOfMotionScore',
    icon: Activity,
    hint: 'makin tinggi makin baik',
  },
  {
    key: 'strength',
    label: 'Kekuatan',
    short: 'Kekuatan',
    field: 'strengthScore',
    icon: TrendingUp,
    hint: 'makin tinggi makin baik',
  },
  {
    key: 'function',
    label: 'Fungsi',
    short: 'Fungsi',
    field: 'functionScore',
    icon: Activity,
    hint: 'makin tinggi makin baik',
  },
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
  INTAKE: 'Penerimaan awal',
  INACTIVE: 'Tidak aktif',
  DISCHARGED: 'Selesai terapi',
  ON_HOLD: 'Ditunda',
  ARCHIVED: 'Diarsipkan',
};

const labelGender = (value: string | null | undefined) => (value ? (GENDER_LABEL[value.toUpperCase()] ?? value) : '-');

const labelCaseStatus = (value: string | null | undefined) =>
  value ? (CASE_STATUS_LABEL[value.toUpperCase()] ?? value) : 'Aktif';

const labelRecordStatus = (value: TherapyProgressView['status']) => (value === 'FINALIZED' ? 'Final' : 'Draf');

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

/**
 * Titik polyline sparkline 0..max → viewBox 120×40 (garis merah ala ECG).
 */
function sparklinePoints(values: number[], max: number): string {
  if (values.length === 0) return '';
  const step = values.length === 1 ? 0 : 120 / (values.length - 1);
  return values
    .map((value, index) => {
      const x = (index * step).toFixed(1);
      const y = (36 - (Math.max(0, Math.min(max, value)) / max) * 30).toFixed(1);
      return `${x},${y}`;
    })
    .join(' ');
}

/* ── Grafik Pemulihan Klinis (recharts) ─────────────────────────── */

type ChartPoint = { sesi: number; label: string; date: string; pain: number; rom: number };

/**
 * Satu KUNJUNGAN: rekam dasar (`base`) beserta seluruh amandemennya.
 * Amandemen adalah REVISI data, bukan kunjungan baru — `latest` adalah versi
 * terbaru yang dipakai untuk nilai terkini, sedangkan nomor & tanggal sesi
 * diambil dari `base`.
 */
type TherapySession = {
  base: TherapyProgressView;
  latest: TherapyProgressView;
  amendments: TherapyProgressView[];
};

function ChartBadge({
  cx,
  cy,
  payload,
  onSelect,
  lastSesi,
}: {
  cx?: number;
  cy?: number;
  payload?: ChartPoint;
  onSelect?: (sesi: number) => void;
  lastSesi?: number;
}) {
  if (typeof cx !== 'number' || typeof cy !== 'number' || !payload) return null;
  const isLast = typeof lastSesi === 'number' && payload.sesi === lastSesi;
  // Label nilai hanya di sesi pertama & terakhir agar grafik tidak penuh label.
  const showLabel = payload.sesi === 1 || isLast;
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
      {showLabel ? (
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
      ) : null}
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
  // Buang tick pecahan (mis. 1.25) yang dibuat recharts pada sumbu numerik —
  // palsu, tidak punya data, dan menciptakan zona klik hantu.
  if (!Number.isInteger(sesi) || sesi < 1 || sesi > length) return null;
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

/** Tooltip hover grafik pemulihan — memberi info skor saat kursor di atas garis. */
function RecoveryTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload?: ChartPoint }> }) {
  if (!active || !payload?.length || !payload[0]?.payload) return null;
  const point = payload[0].payload;
  return (
    <div className="pointer-events-none rounded-xl border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs font-bold text-foreground">
        {point.label} · {point.date}
      </p>
      <p className="text-xs tabular-nums text-muted-foreground">Nyeri {point.pain}/10</p>
      <p className="text-xs tabular-nums text-muted-foreground">ROM {point.rom}%</p>
    </div>
  );
}

function RecoveryChart({ data, onSelectSession }: { data: ChartPoint[]; onSelectSession?: (sesi: number) => void }) {
  const tickDates = useMemo(() => new Map(data.map((point) => [point.sesi, point.date])), [data]);
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
    // Klik hanya valid di dalam rentang data (titik pertama–terakhir) dengan
    // toleransi 24px untuk sentuhan. Klik di margin/tepi luar diabaikan agar
    // tidak ada "kebocoran" event ke luar jangkauan informasi grafik.
    const firstX = uniqueX[0];
    const lastX = uniqueX[uniqueX.length - 1];
    const edgeTolerance = 24;
    if (clickedX < firstX - edgeTolerance || clickedX > lastX + edgeTolerance) return;
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
      className="h-[200px] w-full sm:h-[230px]"
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
          <Tooltip content={<RecoveryTooltip />} wrapperStyle={{ outline: 'none' }} />
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
            dot={<ChartBadge onSelect={onSelectSession} lastSesi={data.length} />}
            activeDot={<ChartBadge onSelect={onSelectSession} lastSesi={data.length} />}
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

  const chartData = useMemo<ChartPoint[]>(
    () =>
      sessions.map((session, index) => ({
        sesi: index + 1,
        label: `Sesi ${index + 1}`,
        date: shortDate(session.base.recordedAt),
        pain: Number(session.latest.painScore),
        rom: Number(session.latest.rangeOfMotionScore) * 10,
      })),
    [sessions],
  );
  const latestChartPoint = chartData.length > 0 ? chartData[chartData.length - 1] : null;

  /** Judul grafik mengikuti data — jangan mengklaim "nyeri turun" bila datanya datar. */
  const recoveryCaption = useMemo(() => {
    const first = chartData[0];
    const last = chartData[chartData.length - 1];
    if (!first || !last || chartData.length < 2) return 'Progres nyeri & gerak dari sesi ke sesi';
    const painDown = last.pain < first.pain;
    const painUp = last.pain > first.pain;
    const romUp = last.rom > first.rom;
    const romDown = last.rom < first.rom;
    if (painDown && romUp) return 'Nyeri turun & gerak naik dari sesi ke sesi';
    if (painUp && romDown) return 'Nyeri naik & gerak turun dari sesi ke sesi';
    if (romUp) return 'Gerak membaik, nyeri belum menurun';
    if (painDown) return 'Nyeri menurun, gerak masih perlu dilatih';
    return 'Progres nyeri & gerak dari sesi ke sesi';
  }, [chartData]);

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

  const calendarEntries = useMemo(
    () =>
      sessions.map((session) => ({
        id: session.latest.id,
        recordedAt: new Date(session.base.recordedAt),
        painScore: session.latest.painScore ?? null,
        rangeOfMotionScore: session.latest.rangeOfMotionScore ?? null,
        status: session.latest.status,
      })),
    [sessions],
  );

  const selectSessionByNumber = useCallback(
    (sesi: number) => {
      const session = sessions[sesi - 1];
      if (session) openSession(session.latest);
    },
    [sessions, openSession],
  );

  const selectCalendarRecord = useCallback(
    (recordId: string) => {
      const record = records.find((item) => item.id === recordId);
      if (record) openSession(record);
    },
    [records, openSession],
  );
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

  /**
   * Kartu "Terapi Berikutnya" — satu sumber untuk versi mobile (di kolom utama)
   * dan versi desktop (rail kanan), agar informasi jadwal selalu mudah diakses
   * di semua breakpoint tanpa duplikasi logic.
   */
  const nextTherapyCard = (
    <section className="hafta-card overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-border/70 px-4 py-3">
        <p className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-muted-foreground">
          <CalendarDays className="h-3 w-3 shrink-0 text-[var(--hafta-300)]" />
          Terapi Berikutnya
        </p>
        {nextSchedule ? (
          <span
            className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold',
              nextSchedule.source === 'PENDING_REQUEST' || nextSchedule.source === 'PENDING_RESCHEDULE'
                ? 'border border-[var(--hafta-org-200)] bg-[var(--hafta-org-50)] text-[var(--hafta-org-700)]'
                : 'bg-[var(--hafta-50)] text-[var(--hafta-700)]',
            )}
          >
            {nextSchedule.statusLabel}
          </span>
        ) : null}
      </div>

      <div className="px-4 py-4">
        {nextSchedule ? (
          <div className="flex items-start gap-3">
            <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-[var(--hafta-900)] text-white">
              <span className="text-xs font-medium text-white/65">{shortWeekday(nextSchedule.dateAt)}</span>
              <span className="text-xl font-semibold leading-tight tabular-nums">{dayNumber(nextSchedule.dateAt)}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold capitalize text-foreground">{monthYear(nextSchedule.dateAt)}</p>
              <p className="mt-0.5 text-sm font-medium tabular-nums text-muted-foreground">
                {nextSchedule.timeText} WIB
              </p>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Stethoscope className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  {nextSchedule.therapistName ??
                    patient?.therapistName ??
                    latestRecord?.therapistName ??
                    'Fisioterapis Hafta'}
                </span>
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Belum ada jadwal terapi berikutnya.</p>
        )}

        {/* Konteks tambahan saat pasien mengajukan perubahan jadwal. */}
        {nextSchedule?.source === 'PENDING_RESCHEDULE' && nextSchedule.previousDateAt ? (
          <p className="mt-3 rounded-xl border border-dashed border-[var(--hafta-org-200)] bg-[var(--hafta-org-50)]/50 px-3 py-2 text-xs leading-relaxed text-[var(--hafta-org-800)]">
            Jadwal saat ini {shortDate(nextSchedule.previousDateAt)} pukul {nextSchedule.previousTimeText} WIB menunggu
            persetujuan perubahan oleh fisioterapis.
          </p>
        ) : null}

        {patient?.therapyFrequencyText ? (
          <p className="mt-3 rounded-xl bg-[var(--hafta-50)] px-3 py-2 text-xs text-[var(--hafta-800)]">
            {patient.therapyFrequencyText}
          </p>
        ) : null}

        <Link
          href="/dashboard/appointments"
          className="mt-3 flex h-11 w-full items-center justify-center gap-1.5 rounded-full border border-border bg-card text-sm font-semibold text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
        >
          Lihat jadwal
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* ── 1. HEADER PASIEN — flat di kanvas, tanpa kartu ── */}
      <header className="border-b border-border pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            {patient?.preferredName ?? patient?.fullName ?? 'Pasien'}
          </h1>
          <span className="rounded-full bg-[var(--hafta-50)] px-2 py-0.5 text-xs font-medium text-[var(--hafta-700)]">
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
              <dt className="text-xs font-semibold text-muted-foreground ">{item.label}</dt>
              <dd className={cn('mt-0.5 truncate text-sm font-medium text-foreground', item.tabular && 'tabular-nums')}>
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </header>
      {/* ── 2. STAT — angka jadi fokus, label kecil di atas ── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          {
            label: 'Total Sesi',
            value: `${sessions.length}`,
            detail: firstRecord ? `sejak ${shortDate(firstRecord.recordedAt)}` : 'belum ada sesi',
            valueClass: 'text-2xl leading-none tracking-tight sm:text-3xl',
          },
          {
            label: 'Progres',
            value: `${averageScore}%`,
            detail: 'rata-rata ROM, kekuatan & fungsi',
            valueClass: 'text-2xl leading-none tracking-tight sm:text-3xl',
          },
          {
            label: 'Berikutnya',
            value: nextScheduleDateLabel,
            // Detail selalu konsisten dengan value: tanggal tampil bila jadwal
            // benar-benar ada; tanpa jadwal jangan menampilkan frekuensi
            // seolah-olah sudah terjadwal.
            detail: nextScheduleDetail,
            // Tanggal — bukan angka murni, jadi lebih kecil dari dua tetangganya.
            valueClass: 'text-base leading-tight tracking-tight sm:text-xl',
          },
        ].map((stat) => (
          <div key={stat.label} className="hafta-card p-3 sm:p-4">
            <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
            <p
              className={cn(
                'mt-1.5 font-semibold tabular-nums text-foreground',
                stat.valueClass,
                stat.label === 'Berikutnya' && 'break-words',
              )}
            >
              {stat.value}
            </p>
            <p className="mt-1.5 line-clamp-2 text-xs leading-snug text-muted-foreground sm:line-clamp-1">
              {stat.detail}
            </p>
          </div>
        ))}
      </div>

      {/* ── 3. TABS ── */}
      <nav
        role="tablist"
        aria-label="Bagian rekam medis"
        className="flex items-stretch gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ touchAction: 'manipulation' }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            onClick={() => selectTab(tab.key)}
            aria-selected={activeTab === tab.key}
            className={cn(
              'relative flex min-h-11 shrink-0 cursor-pointer items-center px-2 pb-1 text-sm font-medium transition-colors first:pl-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35 focus-visible:ring-offset-[-2px]',
              activeTab === tab.key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
            <span
              className={cn(
                'absolute inset-x-1 bottom-0 h-0.5 rounded-full',
                activeTab === tab.key ? 'bg-[var(--hafta-300)]' : 'bg-transparent',
              )}
              aria-hidden="true"
            />
          </button>
        ))}
      </nav>

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
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr_320px] lg:items-start">
            {/* ── kolom 1: kartu vital + evaluasi + dokumen ── */}
            <div className="min-w-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <section aria-label="Nyeri sesi ini" className="rounded-[28px] bg-[#FEF9C3] p-4">
                  <p className="text-xs font-semibold text-[#713F12]">Nyeri (VAS)</p>
                  <div className="mt-1.5 flex items-baseline gap-1">
                    <span className="text-2xl font-bold tabular-nums text-[#422006]">
                      {Number(selectedRecord.painScore ?? 0)}
                    </span>
                    <span className="text-[10px] font-medium text-[#713F12]/70">/10</span>
                  </div>
                  <span
                    className={cn(
                      'mt-1.5 inline-flex rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold',
                      TONE_PILL[metricTone('pain', Number(selectedRecord.painScore ?? 0)).tone],
                    )}
                  >
                    {metricTone('pain', Number(selectedRecord.painScore ?? 0)).label}
                  </span>
                  <svg aria-hidden="true" viewBox="0 0 120 40" className="mt-2 h-9 w-full" fill="none">
                    <polyline
                      points={sparklinePoints(
                        chartData.map((point) => point.pain),
                        10,
                      )}
                      stroke="#EF4444"
                      strokeWidth="2"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  </svg>
                </section>

                <section aria-label="Rentang gerak sesi ini" className="rounded-[28px] bg-[#E0F2FE] p-4">
                  <p className="text-xs font-semibold text-[#075985]">Rentang Gerak</p>
                  <div className="mt-1.5 flex items-baseline gap-1">
                    <span className="text-2xl font-bold tabular-nums text-[#082F49]">
                      {Number(selectedRecord.rangeOfMotionScore ?? 0)}
                    </span>
                    <span className="text-[10px] font-medium text-[#075985]/70">/10</span>
                  </div>
                  <span
                    className={cn(
                      'mt-1.5 inline-flex rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold',
                      TONE_PILL[metricTone('rom', Number(selectedRecord.rangeOfMotionScore ?? 0)).tone],
                    )}
                  >
                    {metricTone('rom', Number(selectedRecord.rangeOfMotionScore ?? 0)).label}
                  </span>
                  <svg aria-hidden="true" viewBox="0 0 120 40" className="mt-2 h-9 w-full" fill="none">
                    <polyline
                      points={sparklinePoints(
                        chartData.map((point) => point.rom),
                        100,
                      )}
                      stroke="#EF4444"
                      strokeWidth="2"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  </svg>
                </section>
              </div>

              {/* kartu besar: evaluasi sesi — kekuatan & fungsi */}
              <section
                aria-label="Kondisi terkini sesi"
                className="rounded-[28px] border border-border bg-card p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground">Kondisi Terkini</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Evaluasi Sesi {visitNumberById.get(selectedRecord.id) ?? 1} ·{' '}
                      {longDate(selectedRecord.recordedAt)}
                    </p>
                  </div>
                  <Button variant="default" size="sm" onClick={() => setPrintRecord(selectedRecord)}>
                    <Printer />
                    Cetak/Unduh
                  </Button>
                </div>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    {(['strength', 'function'] as const).map((metricKey) => {
                      const metric = METRICS.find((item) => item.key === metricKey);
                      if (!metric) return null;
                      const value = Number(selectedRecord[metric.field] ?? 0);
                      const previous = previousRecord ? Number(previousRecord[metric.field] ?? 0) : null;
                      const change = deltaForMetric(metricKey, value, previous);
                      const tone = metricTone(metricKey, value);
                      return (
                        <div key={metricKey} className="flex items-baseline justify-between gap-2">
                          <span className="shrink-0 text-xs font-medium text-muted-foreground">{metric.label}</span>
                          <span className="flex min-w-0 flex-wrap items-baseline justify-end gap-1">
                            <span className="text-xl font-bold leading-none tabular-nums text-foreground">{value}</span>
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
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <Activity
                    aria-hidden="true"
                    className="h-11 w-11 shrink-0 fill-[var(--hafta-300)]/10 text-[var(--hafta-300)]"
                    strokeWidth={1.5}
                  />
                </div>
              </section>

              {/* dokumen sesi terbaru */}
              <section
                aria-label="Dokumen sesi terbaru"
                className="rounded-[28px] border border-border bg-card p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-bold tracking-tight text-foreground">Dokumen Sesi</h2>
                  <button
                    type="button"
                    onClick={() => selectTab('dokumen')}
                    className="tap-target inline-flex min-h-9 cursor-pointer items-center gap-1 rounded-full text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
                  >
                    Semua
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <ul className="mt-2 divide-y divide-border/70">
                  {records.slice(0, 3).map((record) => (
                    <li key={record.id} className="flex items-center gap-3 py-2.5">
                      <span
                        aria-hidden="true"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-muted-foreground"
                      >
                        <FileText className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-foreground">
                          {record.amendedFromId
                            ? `Revisi R${record.revisionNumber ?? 2} · Sesi ${visitNumberById.get(record.id) ?? 0}`
                            : `Rekam medis Sesi ${visitNumberById.get(record.id) ?? 0}`}
                        </span>
                        <span className="block text-[10px] tabular-nums text-muted-foreground">
                          {shortDate(record.recordedAt)} · {labelRecordStatus(record.status)}
                        </span>
                      </span>
                      <button
                        type="button"
                        aria-label={`Cetak/unduh Sesi ${visitNumberById.get(record.id) ?? 0}`}
                        onClick={() => setPrintRecord(record)}
                        className="tap-target flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* ── kolom 2: panggung anatomi interaktif ── */}
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
              fallbackHint="Area keluhan akan ditandai otomatis dari diagnosis sesi terpilih."
            />

            {/* ── kolom 3: jadwal berikutnya + latihan + progres ── */}
            <aside className="min-w-0 space-y-4 lg:sticky lg:top-[88px]">
              {nextTherapyCard}

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

              {/* Temuan utama — tidak menggandakan angka progres di stat pill. */}
              <section
                aria-label="Diagnosis terkini"
                className="relative overflow-hidden rounded-[28px] bg-[#1C1C1E] p-5 text-white shadow-[0_8px_24px_rgba(28,25,23,0.16)]"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 40 160"
                  className="absolute -right-2 bottom-0 h-[85%] w-auto text-white/[0.07]"
                  fill="currentColor"
                >
                  {Array.from({ length: 9 }, (_, index) => {
                    const y = 14 + index * 15;
                    const width = 18 - index * 0.6;
                    return (
                      <g key={index}>
                        <rect x={(40 - width) / 2} y={y} width={width} height={9} rx={3} />
                        <rect x={(40 - 6) / 2} y={y + 9} width={6} height={5} rx={2.5} />
                      </g>
                    );
                  })}
                </svg>
                <div className="relative">
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-full border border-white/25 px-2 py-0.5 text-[10px] font-bold tracking-[0.14em] text-white/70">
                      TEMUAN UTAMA
                    </span>
                    <Stethoscope aria-hidden="true" className="h-4 w-4 shrink-0 text-white/40" />
                  </div>
                  <h2 className="text-balance mt-3 text-lg font-bold tracking-tight">Diagnosis Terkini</h2>
                  <p className="line-clamp-4 mt-1.5 max-w-[85%] text-xs leading-relaxed text-white/60">
                    {selectedRecord.diagnosis || 'Belum ada diagnosis tercatat pada sesi terpilih.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => openSession(selectedRecord)}
                    aria-label="Buka detail lengkap sesi"
                    className="tap-target mt-4 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#FACC15] text-[#1C1C1E] transition-colors hover:bg-[#FDE047] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FACC15]/40"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                </div>
              </section>
            </aside>
          </div>

          {/* ── baris penuh di bawah grid: kalender + catatan sesi terpilih ── */}
          <div className="mt-4 space-y-4">
            {/* 2. grafik pemulihan klinis */}
            {chartData.length >= 2 ? (
              <section id="grafik-pemulihan" className="hafta-card scroll-mt-24 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                  <div className="min-w-0">
                    <h2 className="inline-flex items-center gap-1.5 text-base font-semibold tracking-tight text-foreground">
                      <TrendingUp className="h-3.5 w-3.5 text-[var(--hafta-300)]" />
                      Grafik Pemulihan Klinis
                    </h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">{recoveryCaption}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--hafta-400)]" />
                      Nyeri
                      {latestChartPoint ? (
                        <span className="font-semibold tabular-nums text-foreground">{latestChartPoint.pain}/10</span>
                      ) : null}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        aria-hidden="true"
                        style={{ width: 16, height: 0, borderTop: '2px dashed var(--hafta-900)' }}
                      />
                      ROM
                      {latestChartPoint ? (
                        <span className="font-semibold tabular-nums text-foreground">{latestChartPoint.rom}%</span>
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
                <h2 className="inline-flex items-center gap-1.5 text-base font-semibold tracking-tight text-foreground">
                  <TrendingUp className="h-3.5 w-3.5 text-[var(--hafta-300)]" />
                  Grafik Pemulihan Klinis
                </h2>
                <div className="mt-3 flex items-start gap-3 rounded-2xl border border-dashed border-border bg-[var(--hafta-50)]/60 p-4">
                  <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-[var(--hafta-300)]" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">Grafik mulai tampil setelah 2 evaluasi</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      Setelah sesi berikutnya selesai dinilai, garis progres nyeri dan gerak Anda akan tampil di sini
                      sehingga perkembangan terlihat jelas dari waktu ke waktu.
                    </p>
                  </div>
                </div>
              </section>
            )}
            {records.length > 0 ? (
              <section className="hafta-card p-4 sm:p-5">
                <MemoTherapyCalendar entries={calendarEntries} onSelectRecord={selectCalendarRecord} />
              </section>
            ) : null}

            {/* 4. catatan klinis sesi terpilih */}
            <section className="hafta-card p-4 sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h2 className="inline-flex items-center gap-1.5 text-base font-semibold tracking-tight text-foreground">
                    <NotebookPen className="h-3.5 w-3.5 text-[var(--hafta-300)]" />
                    Perkembangan Terapi
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {longDate(selectedRecord.recordedAt)} · Sesi {visitNumberById.get(selectedRecord.id) ?? 1}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  {selectedRecord.amendedFromId ? (
                    <span className="rounded-full border border-[var(--hafta-org-200)] bg-[var(--hafta-org-50)] px-2 py-0.5 text-xs font-semibold text-[var(--hafta-org-700)]">
                      Revisi R{selectedRecord.revisionNumber ?? 2} · Pembaruan data
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-semibold',
                      selectedRecord.status === 'FINALIZED' ? TONE_PILL.good : 'bg-secondary/60 text-muted-foreground',
                    )}
                  >
                    {labelRecordStatus(selectedRecord.status)}
                  </span>
                </div>
              </div>

              {/* catatan klinis — baris hairline */}
              <dl className="mt-4 divide-y divide-border/70 border-t border-border/70">
                {CLINICAL_ROWS.map((row) => {
                  const value = selectedRecord[row.field];
                  return (
                    <div
                      key={row.field}
                      className="grid gap-0.5 py-2.5 sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)] sm:gap-6"
                    >
                      <dt className="text-xs font-medium text-muted-foreground sm:pt-px">{row.label}</dt>
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

              {/* rencana terapi — hanya bila ada */}
              {treatmentPlan ? (
                <div className="mt-4 border-t border-border/70 pt-3">
                  <h3 className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <ClipboardList className="h-3.5 w-3.5 text-[var(--hafta-300)]" />
                    Rencana Terapi
                  </h3>
                  <dl className="mt-1 divide-y divide-border/70">
                    <div className="grid gap-0.5 py-2.5 sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)] sm:gap-6">
                      <dt className="text-xs font-medium text-muted-foreground sm:pt-px">Tujuan</dt>
                      <dd className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                        {treatmentPlan.goals}
                      </dd>
                    </div>
                    <div className="grid gap-0.5 py-2.5 sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)] sm:gap-6">
                      <dt className="text-xs font-medium text-muted-foreground sm:pt-px">Intervensi</dt>
                      <dd className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                        {treatmentPlan.interventions}
                      </dd>
                    </div>
                    {treatmentPlan.precautions ? (
                      <div className="grid gap-0.5 py-2.5 sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)] sm:gap-6">
                        <dt className="text-xs font-medium text-muted-foreground sm:pt-px">Perhatian</dt>
                        <dd className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
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
                      <span className="block text-sm font-semibold text-foreground">Program Latihan Mandiri</span>
                      <span className="block text-xs text-muted-foreground">
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
          </div>
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
                    className="grid gap-0.5 py-2.5 sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)] sm:gap-6"
                  >
                    <dt className="text-xs font-medium text-muted-foreground sm:pt-px">{row.label}</dt>
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
