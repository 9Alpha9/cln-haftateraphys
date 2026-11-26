'use client';

import Image from 'next/image';
import { useCallback, useRef, useState } from 'react';
import { MousePointer2, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BODY_REGION_IMAGE_POSITIONS,
  REGION_POINTS,
  type BodyRegionKey,
} from '@/components/patient/body-condition-map';

const ANATOMY_SRC = '/assets/anatomy-front.png';
const ANATOMY_WIDTH = 1044;
const ANATOMY_HEIGHT = 1507;

const ZOOM_MIN = 0.8;
const ZOOM_MAX = 2.2;
const ZOOM_STEP = 0.15;

type Tone = 'good' | 'watch' | 'alert';

const TONE_DOT: Record<Tone, string> = {
  good: 'bg-[var(--hafta-grn-500)]',
  watch: 'bg-[var(--hafta-300)]',
  alert: 'bg-[var(--hafta-red-500)]',
};

const TONE_HALO: Record<Tone, string> = {
  good: 'bg-[var(--hafta-grn-500)]/25',
  watch: 'bg-[var(--hafta-300)]/25',
  alert: 'bg-[var(--hafta-red-500)]/25',
};

/**
 * Panggung anatomi untuk Ringkasan rekam medis: gambar anatomi di tengah,
 * penanda area keluhan (dari diagnosis sesi), zoom/pan fungsional.
 *
 * Penanda & popover TIDAK ikut menskala saat zoom — ukurannya dikompensasi
 * `scale(1/scale)` sehingga tetap mudah dibaca & diklik di semua level zoom.
 */
export function TherapyAnatomyStage({
  markers,
  tone,
  onRegionSelect,
  fallbackHint,
}: {
  markers: BodyRegionKey[];
  tone: Tone;
  onRegionSelect?: (region: BodyRegionKey) => void;
  fallbackHint: string;
}) {
  const [activeRegion, setActiveRegion] = useState<BodyRegionKey | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [pointerMode, setPointerMode] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

  const activePoint = activeRegion ? BODY_REGION_IMAGE_POSITIONS[activeRegion] : null;
  const activeLabel = activeRegion ? REGION_POINTS[activeRegion].label : null;

  const zoomIn = useCallback(() => setScale((s) => Math.min(ZOOM_MAX, s + ZOOM_STEP)), []);
  const zoomOut = useCallback(() => setScale((s) => Math.max(ZOOM_MIN, s - ZOOM_STEP)), []);
  const resetView = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

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
    setActiveRegion(null);
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

  /** Kompensasi zoom: penanda/popover selalu ukuran asli di layar. */
  const inverseScale = 1 / scale;

  return (
    <section
      aria-label="Peta kondisi tubuh"
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

      {/* ── kanvas anatomi ── */}
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
          <div className="relative aspect-[1044/1507] w-full">
            <Image
              src={ANATOMY_SRC}
              alt="Anatomi tubuh manusia tampak depan"
              width={ANATOMY_WIDTH}
              height={ANATOMY_HEIGHT}
              priority
              draggable={false}
              className="h-full w-full object-contain"
            />

            {/* ── penanda area keluhan (tidak ikut zoom) ── */}
            {markers.map((region) => {
              const point = BODY_REGION_IMAGE_POSITIONS[region];
              const isActive = region === activeRegion;
              return (
                <button
                  key={region}
                  type="button"
                  data-stage-hotspot
                  aria-label={`Area keluhan: ${REGION_POINTS[region].label}`}
                  aria-expanded={isActive}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (!pointerMode) setActiveRegion(isActive ? null : region);
                  }}
                  className="absolute cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FACC15]/50"
                  style={{
                    left: `${point.x}%`,
                    top: `${point.y}%`,
                    transform: `translate(-50%, -50%) scale(${inverseScale})`,
                  }}
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

            {/* ── popover area ── */}
            {activeRegion && activePoint ? (
              <div
                data-stage-popover
                role="dialog"
                aria-label={`Area ${activeLabel}`}
                onPointerDown={(event) => event.stopPropagation()}
                className="absolute z-30 w-52 -translate-y-1/2"
                style={{
                  left: activePoint.x > 60 ? `${activePoint.x}%` : `calc(${activePoint.x}% + 14px)`,
                  top: `${activePoint.y}%`,
                  transform:
                    activePoint.x > 60
                      ? `translate(calc(-100% - 14px), -50%) scale(${inverseScale})`
                      : `translateY(-50%) scale(${inverseScale})`,
                }}
              >
                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 flex items-center gap-1.5 text-sm font-bold text-foreground">
                      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${TONE_DOT[tone]}`} />
                      {activeLabel}
                    </p>
                    <button
                      type="button"
                      aria-label="Tutup detail"
                      onClick={() => setActiveRegion(null)}
                      className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    Area ini disebut pada diagnosis sesi terpilih.
                  </p>
                  {onRegionSelect ? (
                    <button
                      type="button"
                      onClick={() => {
                        onRegionSelect(activeRegion);
                        setActiveRegion(null);
                      }}
                      className="mt-2.5 inline-flex min-h-9 w-full cursor-pointer items-center justify-center rounded-full bg-[var(--hafta-950)] px-3 text-xs font-semibold text-white transition-colors hover:bg-[var(--hafta-900)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
                    >
                      Lihat Detail Sesi
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}

            {/* fallback bila belum ada area terdeteksi */}
            {markers.length === 0 && !activeRegion ? (
              <p className="absolute inset-x-0 bottom-2 mx-auto max-w-[80%] rounded-full bg-white/85 px-3 py-1.5 text-center text-[10px] leading-snug text-muted-foreground shadow-sm backdrop-blur">
                {fallbackHint}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── kontrol kanvas ── */}
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

      {/* legenda nada penanda — sinyal ganda: warna + teks */}
      {markers.length > 0 ? (
        <div className="absolute left-4 top-4 rounded-full border border-slate-200/80 bg-white/90 px-3 py-1.5 shadow-sm backdrop-blur">
          <p className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
            <span aria-hidden="true" className={`h-2 w-2 rounded-full ${TONE_DOT[tone]}`} />
            <span>
              {markers.length} area · nada mengikuti skor nyeri sesi
              <span
                className={cn(
                  'ml-1.5 font-semibold',
                  tone === 'alert' ? 'text-[var(--hafta-red-700)]' : 'text-foreground',
                )}
              >
                ({tone === 'good' ? 'Ringan' : tone === 'watch' ? 'Sedang' : 'Tinggi'})
              </span>
            </span>
          </p>
        </div>
      ) : null}
    </section>
  );
}
