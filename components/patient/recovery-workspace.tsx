'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChevronRight, ClipboardList, Dumbbell, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TherapyCalendar, type TherapyCalendarEntry } from '@/components/patient/therapy-calendar';
import {
  CLINICAL_ROWS,
  labelRecordStatus,
  longDate,
  shortDate,
  TONE_PILL,
} from '@/components/patient/medical-record-utils';
import { cn } from '@/lib/utils';
import type { TherapyProgressView } from '@/server/queries/therapy-progress';
import type { HomeProgramView } from '@/server/queries/home-programs';
import type { TreatmentPlanView } from '@/server/queries/treatment-plans';

export type ChartPoint = { sesi: number; label: string; date: string; pain: number; rom: number };

/**
 * Satu KUNJUNGAN: rekam dasar (`base`) beserta seluruh amandemennya.
 * `latest` = versi terbaru yang dipakai untuk nilai terkini.
 */
export type RecoverySession = {
  base: TherapyProgressView;
  latest: TherapyProgressView;
  amendments: TherapyProgressView[];
};

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

function MetricDot({
  cx,
  cy,
  payload,
  onSelect,
  lastSesi,
  hollow,
}: {
  cx?: number;
  cy?: number;
  payload?: ChartPoint;
  onSelect?: (sesi: number) => void;
  lastSesi?: number;
  hollow?: boolean;
}) {
  if (typeof cx !== 'number' || typeof cy !== 'number') return null;
  const isLast = typeof lastSesi === 'number' && payload?.sesi === lastSesi;
  return (
    <g
      data-chart-dot={payload?.sesi ?? 0}
      onClick={() => onSelect?.(payload?.sesi ?? 0)}
      style={onSelect ? { cursor: 'pointer' } : undefined}
    >
      {/* area sentuh lebih besar agar mudah diklik di layar sentuh */}
      <circle cx={cx} cy={cy} r={14} fill="transparent" />
      {isLast ? <circle cx={cx} cy={cy} r={9} fill="var(--hafta-300)" opacity={0.22} /> : null}
      {hollow ? (
        <circle cx={cx} cy={cy} r={4.5} fill="#fff" stroke="var(--hafta-400)" strokeWidth={2} />
      ) : (
        <circle cx={cx} cy={cy} r={3.5} fill="var(--hafta-900)" />
      )}
    </g>
  );
}

/** Tooltip hover per metrik — VAS dan ROM punya unit berbeda. */
type MetricChartKey = 'pain' | 'rom';

const METRIC_CHART: Record<
  MetricChartKey,
  { label: string; domain: [number, number]; stroke: string; dashed: boolean; hollow: boolean }
> = {
  pain: { label: 'nyeri (VAS)', domain: [0, 10], stroke: 'var(--hafta-400)', dashed: false, hollow: true },
  rom: { label: 'rentang gerak', domain: [0, 100], stroke: 'var(--hafta-900)', dashed: true, hollow: false },
};

function MetricTooltip({
  active,
  payload,
  metric,
}: {
  active?: boolean;
  payload?: Array<{ payload?: ChartPoint }>;
  metric: MetricChartKey;
}) {
  if (!active || !payload?.length || !payload[0]?.payload) return null;
  const point = payload[0].payload;
  return (
    <div className="pointer-events-none rounded-xl border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs font-bold text-foreground">
        {point.label} · {point.date}
      </p>
      <p className="text-xs tabular-nums text-muted-foreground">
        {metric === 'pain' ? `Nyeri ${point.pain}/10` : `Rentang gerak ${point.rom}%`}
      </p>
    </div>
  );
}

/**
 * Grafik SATU metrik (VAS atau ROM) — unit & skala klinis aslinya,
 * tanpa nilai historis palsu.
 */
function MetricLineChart({
  data,
  metric,
  onSelectSession,
}: {
  data: ChartPoint[];
  metric: MetricChartKey;
  onSelectSession?: (sesi: number) => void;
}) {
  const config = METRIC_CHART[metric];
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
      className="h-[170px] w-full sm:h-[190px]"
      role="group"
      aria-label={`Grafik ${config.label} per sesi. Ketuk titik untuk membuka sesi.`}
      onClick={handleSurfaceClick}
      style={{
        cursor: onSelectSession ? 'pointer' : undefined,
        touchAction: onSelectSession ? 'manipulation' : undefined,
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 36, bottom: 8, left: -12 }}>
          <CartesianGrid vertical={false} stroke="var(--hafta-100)" strokeDasharray="4 6" />
          <YAxis yAxisId="metric" domain={config.domain} tickLine={false} axisLine={false} tick={false} />
          <XAxis
            dataKey="sesi"
            type="number"
            domain={[1, data.length]}
            padding={{ left: 12, right: 4 }}
            tickLine={false}
            axisLine={false}
            interval={tickInterval}
            tick={(props: { x?: number; y?: number; payload?: { value: number } }) => (
              <ChartTick {...props} length={data.length} dates={tickDates} onSelect={onSelectSession} />
            )}
          />
          <Tooltip content={<MetricTooltip metric={metric} />} wrapperStyle={{ outline: 'none' }} />
          <Line
            yAxisId="metric"
            type="monotone"
            dataKey={metric}
            stroke={config.stroke}
            strokeWidth={2}
            strokeDasharray={config.dashed ? '6 5' : undefined}
            dot={<MetricDot onSelect={onSelectSession} lastSesi={data.length} hollow={config.hollow} />}
            activeDot={<MetricDot onSelect={onSelectSession} lastSesi={data.length} hollow={config.hollow} />}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Grafik di-memo agar panel detail bisa dibuka tanpa re-render grafik. */
const MemoMetricChart = memo(MetricLineChart);
const MemoTherapyCalendar = memo(TherapyCalendar);

/**
 * Workspace "Perjalanan Pemulihan" — tab Grafik / Kalender / Perkembangan.
 * Dipakai di kartu kolom kanan (compact) dan diperluas lewat GlobalModal.
 * Hanya SATU panel aktif yang dirender; sesi terpilih tetap sama saat
 * berpindah tab (state induk).
 */
export function RecoveryWorkspace({
  sessions,
  selectedRecordId,
  onSelectRecord,
  treatmentPlan,
  homeProgram,
  onProgramOpen,
}: {
  sessions: RecoverySession[];
  selectedRecordId: string;
  onSelectRecord: (recordId: string) => void;
  treatmentPlan: TreatmentPlanView | null;
  homeProgram: HomeProgramView | null;
  onProgramOpen: () => void;
}) {
  const [workspaceTab, setWorkspaceTab] = useState<'grafik' | 'kalender' | 'perkembangan'>('grafik');

  const selectedRecord = useMemo(() => {
    return (
      sessions.find(
        (session) =>
          session.base.id === selectedRecordId ||
          session.latest.id === selectedRecordId ||
          session.amendments.some((amendment) => amendment.id === selectedRecordId),
      )?.latest ??
      sessions[sessions.length - 1]?.latest ??
      null
    );
  }, [sessions, selectedRecordId]);

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
      if (session) onSelectRecord(session.latest.id);
    },
    [sessions, onSelectRecord],
  );

  /** Tanggal kalender diketuk → sesi terkait terpilih (tanpa pindah tab). */
  const selectCalendarDay = useCallback(
    (entry: TherapyCalendarEntry) => {
      onSelectRecord(entry.id);
    },
    [onSelectRecord],
  );

  /** "Lihat" pada kalender → sesi terpilih + buka tab Perkembangan (tanpa drawer). */
  const openCalendarDetail = useCallback(
    (recordId: string) => {
      onSelectRecord(recordId);
      setWorkspaceTab('perkembangan');
    },
    [onSelectRecord],
  );

  if (!selectedRecord) return null;

  return (
    <div>
      <p className="text-xs text-muted-foreground">
        {recoveryCaption} · Sesi {visitNumberById.get(selectedRecord.id) ?? 1} dari {sessions.length} dipilih
      </p>

      <Tabs value={workspaceTab} onValueChange={(value) => setWorkspaceTab(value as typeof workspaceTab)}>
        <TabsList className="mt-2.5 gap-1 rounded-full bg-[var(--hafta-50)] p-1">
          {(
            [
              { key: 'grafik', label: 'Grafik' },
              { key: 'kalender', label: 'Kalender' },
              { key: 'perkembangan', label: 'Perkembangan' },
            ] as const
          ).map((tab) => (
            <TabsTrigger
              key={tab.key}
              value={tab.key}
              className="min-h-9 rounded-full px-4 text-xs font-semibold data-[state=active]:bg-[var(--hafta-950)] data-[state=active]:text-white"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── GRAFIK: VAS & ROM dipisah — unit berbeda (0–10 vs %) ── */}
        <TabsContent value="grafik" className="mt-4 outline-none">
          {chartData.length >= 2 ? (
            <div className="grid gap-5 xl:grid-cols-2">
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-muted-foreground">Nyeri (VAS)</p>
                  {latestChartPoint ? (
                    <p className="text-xs font-semibold tabular-nums text-foreground">{latestChartPoint.pain}/10</p>
                  ) : null}
                </div>
                <div className="mt-1">
                  <MemoMetricChart data={chartData} metric="pain" onSelectSession={selectSessionByNumber} />
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-muted-foreground">Rentang Gerak</p>
                  {latestChartPoint ? (
                    <p className="text-xs font-semibold tabular-nums text-foreground">{latestChartPoint.rom}%</p>
                  ) : null}
                </div>
                <div className="mt-1">
                  <MemoMetricChart data={chartData} metric="rom" onSelectSession={selectSessionByNumber} />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-2xl border border-dashed border-border bg-[var(--hafta-50)]/60 p-4">
              <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-[var(--hafta-300)]" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground">Grafik mulai tampil setelah 2 evaluasi</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  Setelah sesi berikutnya selesai dinilai, garis progres nyeri dan gerak Anda akan tampil di sini
                  sehingga perkembangan terlihat jelas dari waktu ke waktu.
                </p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── KALENDER: compact, tanggal terapi memilih sesi terkait ── */}
        <TabsContent value="kalender" className="mt-4 outline-none">
          {sessions.length > 0 ? (
            <div className="mx-auto w-full max-w-[560px]">
              <MemoTherapyCalendar
                entries={calendarEntries}
                onSelectDay={selectCalendarDay}
                onSelectRecord={openCalendarDetail}
              />
            </div>
          ) : null}
        </TabsContent>

        {/* ── PERKEMBANGAN: detail klinis terstruktur sesi terpilih ── */}
        <TabsContent value="perkembangan" className="mt-4 outline-none">
          {/* pemilih sesi — sesi tetap terpilih saat berpindah tab */}
          <div
            role="group"
            aria-label="Pilih sesi"
            className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {sessions.map((session, index) => {
              const record = session.latest;
              const isActive = session.base.id === selectedRecord.id || record.id === selectedRecord.id;
              return (
                <button
                  key={session.base.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => onSelectRecord(record.id)}
                  className={cn(
                    'tap-target shrink-0 cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35',
                    isActive
                      ? 'border-transparent bg-[var(--hafta-950)] text-white'
                      : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  Sesi {index + 1} · {shortDate(session.base.recordedAt)}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="min-w-0 text-xs text-muted-foreground">
              {longDate(selectedRecord.recordedAt)} · Sesi {visitNumberById.get(selectedRecord.id) ?? 1}
            </p>
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
          <dl className="mt-3 divide-y divide-border/70 border-t border-border/70">
            {CLINICAL_ROWS.map((row) => {
              const value = selectedRecord[row.field];
              return (
                <div
                  key={row.field}
                  className="grid gap-0.5 py-2 xl:grid-cols-[minmax(0,180px)_minmax(0,1fr)] xl:gap-6"
                >
                  <dt className="text-xs font-medium text-muted-foreground xl:pt-px">{row.label}</dt>
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
            <div className="mt-3 border-t border-border/70 pt-3">
              <h3 className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <ClipboardList className="h-3.5 w-3.5 text-[var(--hafta-300)]" />
                Rencana Terapi
              </h3>
              <dl className="mt-1 divide-y divide-border/70">
                <div className="grid gap-0.5 py-2 xl:grid-cols-[minmax(0,180px)_minmax(0,1fr)] xl:gap-6">
                  <dt className="text-xs font-medium text-muted-foreground xl:pt-px">Tujuan</dt>
                  <dd className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{treatmentPlan.goals}</dd>
                </div>
                <div className="grid gap-0.5 py-2 xl:grid-cols-[minmax(0,180px)_minmax(0,1fr)] xl:gap-6">
                  <dt className="text-xs font-medium text-muted-foreground xl:pt-px">Intervensi</dt>
                  <dd className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {treatmentPlan.interventions}
                  </dd>
                </div>
                {treatmentPlan.precautions ? (
                  <div className="grid gap-0.5 py-2 xl:grid-cols-[minmax(0,180px)_minmax(0,1fr)] xl:gap-6">
                    <dt className="text-xs font-medium text-muted-foreground xl:pt-px">Perhatian</dt>
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
            <div className="mt-3 border-t border-border/70 pt-3">
              <button
                type="button"
                onClick={onProgramOpen}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
