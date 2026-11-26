'use client';

import Image from 'next/image';
import { useCallback, useRef, useState } from 'react';
import { MousePointer2, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BMI_RANGES, THERAPY_POINTS } from './data';

const ANATOMY_SRC = '/assets/body-anatomy/muscular-anterior.webp';
const ANATOMY_WIDTH = 841;
const ANATOMY_HEIGHT = 1510;

const ZOOM_MIN = 0.8;
const ZOOM_MAX = 2.2;
const ZOOM_STEP = 0.15;

type BmiMode = keyof typeof BMI_RANGES;

/**
 * Area tengah: panggung anatomi interaktif dengan hotspot terapi,
 * zoom/pan fungsional, widget BMI, dan lantai grid perspektif.
 */
export function AnatomyInteractiveStage() {
  const [activePointId, setActivePointId] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [pointerMode, setPointerMode] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

  const [bmiMode, setBmiMode] = useState<BmiMode>('weight');
  const [bmiValue, setBmiValue] = useState(BMI_RANGES.weight.initial);

  const activePoint = THERAPY_POINTS.find((point) => point.id === activePointId) ?? null;

  const zoomIn = useCallback(() => setScale((s) => Math.min(ZOOM_MAX, s + ZOOM_STEP)), []);
  const zoomOut = useCallback(() => setScale((s) => Math.max(ZOOM_MIN, s - ZOOM_STEP)), []);
  const resetView = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  /** Drag di kanvas = pan. Pin & popover menghentikan propagasi agar tetap bisa diklik. */
  const handleStagePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as Element;
    if (target.closest('[data-stage-hotspot]') || target.closest('[data-stage-popover]')) return;
    dragRef.current = { startX: event.clientX, startY: event.clientY, originX: offset.x, originY: offset.y };
    setDragging(true);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer sudah tidak aktif — pan tetap berjalan lewat dragRef.
    }
    setActivePointId(null);
  };

  const handleStagePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    setOffset({ x: drag.originX + (event.clientX - drag.startX), y: drag.originY + (event.clientY - drag.startY) });
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
  };

  const bmiConfig = BMI_RANGES[bmiMode];
  const selectBmiMode = (mode: BmiMode) => {
    setBmiMode(mode);
    setBmiValue(BMI_RANGES[mode].initial);
  };

  return (
    <section
      aria-label="Panggung anatomi interaktif"
      className="relative min-h-[560px] overflow-hidden rounded-[28px] border border-border bg-gradient-to-b from-[#F8FAFC] to-[#EEF2F6] shadow-[0_1px_2px_rgba(28,25,23,0.04)] sm:min-h-[640px]"
    >
      {/* ── lantai grid perspektif ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-56"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to right, rgba(100,116,139,0.16) 0 1px, transparent 1px 44px), repeating-linear-gradient(to top, rgba(100,116,139,0.16) 0 1px, transparent 1px 36px)',
          maskImage: 'linear-gradient(to top, black 0%, transparent 85%)',
          WebkitMaskImage: 'linear-gradient(to top, black 0%, transparent 85%)',
        }}
      />

      {/* ── kanvas anatomi: drag = pan, pin = detail ── */}
      <div
        className={cn(
          'absolute inset-0 select-none touch-none',
          pointerMode ? 'cursor-crosshair' : dragging ? 'cursor-grabbing' : 'cursor-grab',
        )}
        onPointerDown={handleStagePointerDown}
        onPointerMove={handleStagePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div
          className="absolute left-1/2 top-1/2 w-[min(58%,320px)] sm:w-[min(52%,360px)]"
          style={{
            transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${scale})`,
            transition: dragging ? 'none' : 'transform 200ms cubic-bezier(0.2, 0, 0, 1)',
          }}
        >
          <div className="relative aspect-[841/1510] w-full">
            <Image
              src={ANATOMY_SRC}
              alt="Anatomi tubuh manusia tampak depan"
              width={ANATOMY_WIDTH}
              height={ANATOMY_HEIGHT}
              priority
              draggable={false}
              className="h-full w-full object-contain"
            />

            {/* ── hotspot terapi ── */}
            {THERAPY_POINTS.map((point) => {
              const isActive = point.id === activePointId;
              return (
                <button
                  key={point.id}
                  type="button"
                  data-stage-hotspot
                  aria-label={`Titik terapi: ${point.partName}`}
                  aria-expanded={isActive}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (!pointerMode) setActivePointId(isActive ? null : point.id);
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FACC15]/50"
                  style={{ left: `${point.x}%`, top: `${point.y}%` }}
                >
                  <span className="relative flex h-5 w-5 items-center justify-center">
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute inset-0 rounded-full motion-safe:animate-ping',
                        isActive ? 'bg-[#FACC15]/30' : 'bg-slate-400/25',
                      )}
                    />
                    <span
                      aria-hidden="true"
                      className={cn(
                        'relative h-3.5 w-3.5 rounded-full border-2 bg-white shadow-sm',
                        isActive ? 'border-[#FACC15] ring-2 ring-[#FACC15]/40' : 'border-slate-400/80',
                      )}
                    />
                  </span>
                </button>
              );
            })}

            {/* ── popover detail titik ── */}
            {activePoint ? (
              <div
                data-stage-popover
                role="dialog"
                aria-label={`Detail terapi ${activePoint.partName}`}
                onPointerDown={(event) => event.stopPropagation()}
                className="absolute z-30 w-56 -translate-y-1/2 sm:w-60"
                style={
                  activePoint.x > 60
                    ? {
                        left: `${activePoint.x}%`,
                        top: `${activePoint.y}%`,
                        transform: 'translate(calc(-100% - 14px), -50%)',
                      }
                    : { left: `calc(${activePoint.x}% + 14px)`, top: `${activePoint.y}%` }
                }
              >
                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 text-sm font-bold text-foreground">{activePoint.partName}</p>
                    <button
                      type="button"
                      aria-label="Tutup detail"
                      onClick={() => setActivePointId(null)}
                      className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <dl className="mt-2 space-y-2">
                    <div>
                      <dt className="text-[10px] font-semibold text-muted-foreground">Keluhan / diagnosis</dt>
                      <dd className="mt-0.5 text-xs leading-relaxed text-foreground">{activePoint.condition}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-semibold text-muted-foreground">Metode terapi</dt>
                      <dd className="mt-0.5 text-xs leading-relaxed text-foreground">{activePoint.therapyMethod}</dd>
                    </div>
                    <div>
                      <dt className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground">
                        Progres
                        <span className="tabular-nums">{activePoint.progress}%</span>
                      </dt>
                      <dd className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70">
                        <span
                          className="block h-full rounded-full bg-[#FACC15]"
                          style={{ width: `${activePoint.progress}%` }}
                        />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-semibold text-muted-foreground">Catatan terapis</dt>
                      <dd className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {activePoint.therapistNotes}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── widget Body Mass Index ── */}
      <div className="absolute inset-x-0 bottom-4 flex justify-center px-4">
        <div className="flex max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-full border border-slate-200/80 bg-white/90 px-4 py-2 shadow-sm backdrop-blur">
          <p className="text-[11px] font-bold text-foreground">Body Mass Index</p>
          <div
            className="flex items-center gap-1 rounded-full bg-slate-100 p-0.5"
            role="group"
            aria-label="Mode pengukuran"
          >
            {(Object.keys(BMI_RANGES) as BmiMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={bmiMode === mode}
                onClick={() => selectBmiMode(mode)}
                className={cn(
                  'flex min-h-7 cursor-pointer items-center rounded-full px-2.5 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35',
                  bmiMode === mode ? 'bg-[#111827] text-white' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {BMI_RANGES[mode].label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-0.5" role="group" aria-label={`Ruler ${bmiConfig.label}`}>
            {bmiConfig.ticks.map((tick) => (
              <button
                key={tick}
                type="button"
                aria-pressed={bmiValue === tick}
                aria-label={`${bmiConfig.label} ${tick} ${bmiConfig.unit}`}
                onClick={() => setBmiValue(tick)}
                className={cn(
                  'flex h-7 min-w-7 cursor-pointer items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35',
                  bmiValue === tick ? 'bg-[#111827] text-white' : 'text-muted-foreground hover:bg-slate-100',
                )}
              >
                {tick}
              </button>
            ))}
            <span className="ml-1 text-[10px] font-semibold text-muted-foreground">{bmiConfig.unit}</span>
          </div>
        </div>
      </div>

      {/* ── kontrol kanvas: reset, mode pointer, zoom ── */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1 rounded-full border border-slate-200/80 bg-white/90 p-1 shadow-sm backdrop-blur">
        <button
          type="button"
          aria-label="Reset tampilan"
          onClick={resetView}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Mode pointer pilih"
          aria-pressed={pointerMode}
          onClick={() => setPointerMode((mode) => !mode)}
          className={cn(
            'flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35',
            pointerMode ? 'bg-[#111827] text-white' : 'text-muted-foreground hover:bg-slate-100 hover:text-foreground',
          )}
        >
          <MousePointer2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Perbesar"
          onClick={zoomIn}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Perkecil"
          onClick={zoomOut}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
