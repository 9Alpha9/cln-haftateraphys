'use client';

import Image from 'next/image';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { MousePointer2, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BODY_REGION_IMAGE_POSITIONS,
  REGION_POINTS,
  type DetectedRegion,
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

const TONE_LABEL: Record<Tone, string> = {
  good: 'Ringan',
  watch: 'Sedang',
  alert: 'Tinggi',
};

/**
 * Ringkasan masalah area — ditampilkan DI POPOVER sebelum pasien membuka
 * drawer detail lengkap.
 */
export type AnatomyAreaDetail = {
  condition: string;
  therapyMethod: string;
};

/**
 * Panggung anatomi untuk Ringkasan rekam medis.
 *
 * Aturan zoom: HANYA gambar anatomi yang menskala. Penanda dikompensasi
 * `scale(1/scale)`; popover, legenda, dan kontrol berada di luar kanvas
 * sehingga ukurannya selalu stabil di semua level zoom. Posisi popover
 * dihitung terhadap panggung dan diklem — tidak pernah terpotong.
 */
export function TherapyAnatomyStage({
  markers,
  tone,
  detail,
  onRegionSelect,
  fallbackHint,
}: {
  markers: DetectedRegion[];
  tone: Tone;
  detail: AnatomyAreaDetail | null;
  onRegionSelect?: (region: DetectedRegion) => void;
  fallbackHint: string;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [pointerMode, setPointerMode] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGLineElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
  /** Id area terakhir yang garisnya dianimasikan — animasi hanya sekali per pilihan. */
  const lineAnimatedFor = useRef<string | null>(null);

  const activeMarker = markers.find((marker) => markerId(marker) === activeId) ?? null;

  const zoomIn = useCallback(() => setScale((s) => Math.min(ZOOM_MAX, s + ZOOM_STEP)), []);
  const zoomOut = useCallback(() => setScale((s) => Math.max(ZOOM_MIN, s - ZOOM_STEP)), []);
  const resetView = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  /**
   * Klem posisi popover + gambarkan garis penunjuk (pin → kartu) langsung ke
   * DOM di useLayoutEffect — sebelum paint, tanpa re-render — sehingga popover
   * tidak pernah terpotong dan garis otomatis "menunjuk" di semua level zoom.
   * Garis dianimasikan menggambar dirinya (stroke-dashoffset) hanya saat area
   * baru dipilih; menghormati prefers-reduced-motion.
   */
  useLayoutEffect(() => {
    const section = sectionRef.current;
    const pop = popRef.current;
    const line = lineRef.current;
    const dot = dotRef.current;
    if (!section || !pop || !activeMarker) {
      lineAnimatedFor.current = null;
      return;
    }
    const pin = section.querySelector(`[data-hotspot-id="${CSS.escape(markerId(activeMarker))}"]`);
    if (!pin) return;

    const stage = section.getBoundingClientRect();
    const pinRect = pin.getBoundingClientRect();
    const popW = pop.offsetWidth;
    const popH = pop.offsetHeight;
    const margin = 10;
    const gap = 12;

    let left = pinRect.right - stage.left + gap;
    let top = pinRect.top - stage.top + pinRect.height / 2 - popH / 2;
    if (left + popW > stage.width - margin) {
      left = pinRect.left - stage.left - popW - gap; // flip ke kiri pin
    }
    if (left + popW > stage.width - margin) left = stage.width - popW - margin;
    if (left < margin) left = margin;
    if (top + popH > stage.height - margin) top = stage.height - popH - margin;
    if (top < margin) top = margin;
    pop.style.left = `${Math.round(left)}px`;
    pop.style.top = `${Math.round(top)}px`;

    // ── garis penunjuk: dari titik pin ke tepi kartu terdekat ──
    if (line) {
      const popRect = pop.getBoundingClientRect();
      const pinCx = pinRect.left + pinRect.width / 2 - stage.left;
      const pinCy = pinRect.top + pinRect.height / 2 - stage.top;
      const popIsRight = popRect.left + 1 >= pinRect.right;
      const endX = popIsRight ? popRect.left - stage.left : popRect.right - stage.left;
      const endY = Math.min(Math.max(pinCy, popRect.top - stage.top + 12), popRect.bottom - stage.top - 12);
      const length = Math.hypot(endX - pinCx, endY - pinCy);
      line.setAttribute('x1', String(Math.round(pinCx)));
      line.setAttribute('y1', String(Math.round(pinCy)));
      line.setAttribute('x2', String(Math.round(endX)));
      line.setAttribute('y2', String(Math.round(endY)));
      line.style.strokeDasharray = `${Math.max(1, Math.round(length))}`;

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const isNewSelection = lineAnimatedFor.current !== activeId;
      if (isNewSelection && !reduceMotion && length > 1) {
        lineAnimatedFor.current = activeId;
        // Set titik awal, paksa reflow, lalu animasikan — teknik standar agar
        // transisi stroke-dashoffset benar-benar berjalan di frame berikutnya.
        line.style.transition = 'none';
        line.style.strokeDashoffset = `${Math.max(1, Math.round(length))}`;
        void line.getBoundingClientRect();
        line.style.transition = 'stroke-dashoffset 340ms cubic-bezier(0.2, 0, 0, 1)';
        line.style.strokeDashoffset = '0';
      } else {
        lineAnimatedFor.current = activeId;
        line.style.transition = 'none';
        line.style.strokeDashoffset = '0';
      }

      if (dot) {
        dot.setAttribute('cx', String(Math.round(endX)));
        dot.setAttribute('cy', String(Math.round(endY)));
        if (isNewSelection && !reduceMotion && length > 1) {
          dot.style.transition = 'none';
          dot.style.opacity = '0';
          void dot.getBoundingClientRect();
          dot.style.transition = 'opacity 260ms ease 160ms';
          dot.style.opacity = '1';
        } else {
          dot.style.transition = 'none';
          dot.style.opacity = '1';
        }
      }
    }
  }, [activeMarker, activeId, scale, offset]);

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
    setActiveId(null);
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

  /** Kompensasi zoom: penanda selalu ukuran asli di layar. */
  const inverseScale = 1 / scale;

  return (
    <section
      ref={sectionRef}
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

      {/* ── kanvas anatomi (hanya gambar yang zoom) ── */}
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

            {/* ── penanda area keluhan (posisi terkalibrasi, tidak ikut zoom) ── */}
            {markers.map((marker) => {
              const position = regionPosition(marker);
              const label = regionLabel(marker);
              const isActive = activeId === markerId(marker);
              return (
                <button
                  key={markerId(marker)}
                  type="button"
                  data-stage-hotspot
                  data-hotspot-id={markerId(marker)}
                  aria-label={`Area keluhan: ${label}`}
                  aria-expanded={isActive}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (!pointerMode) setActiveId(isActive ? null : markerId(marker));
                  }}
                  className="absolute cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FACC15]/50"
                  style={{
                    left: `${position.x}%`,
                    top: `${position.y}%`,
                    transform: `translate(-50%, -50%) scale(${inverseScale})`,
                  }}
                >
                  <span className="relative flex h-5 w-5 items-center justify-center">
                    {/* halo statis; denyut hanya pada penanda aktif */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute inset-0 rounded-full',
                        isActive ? 'bg-[#FACC15]/30 motion-safe:animate-ping' : 'bg-slate-400/15',
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
          </div>
        </div>
      </div>

      {/* ── garis penunjuk pin → kartu (animasi menggambar dirinya) ── */}
      {activeMarker ? (
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible">
          <line
            ref={lineRef}
            x1={0}
            y1={0}
            x2={0}
            y2={0}
            stroke="rgba(100,116,139,0.8)"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
          <circle ref={dotRef} cx={0} cy={0} r={2.5} fill="rgba(100,116,139,0.9)" opacity={0} />
        </svg>
      ) : null}

      {/* ── popover area — di LUAR kanvas: tidak ikut zoom & tidak terpotong ── */}
      {activeMarker ? (
        <div
          ref={popRef}
          data-stage-popover
          role="dialog"
          aria-label={`Area ${regionLabel(activeMarker)}`}
          onPointerDown={(event) => event.stopPropagation()}
          className="absolute left-0 top-0 z-30 w-56 sm:w-60"
        >
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 flex items-center gap-1.5 text-sm font-bold text-foreground">
                <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${TONE_DOT[tone]}`} />
                {regionLabel(activeMarker)}
              </p>
              <button
                type="button"
                aria-label="Tutup detail"
                onClick={() => setActiveId(null)}
                className="tap-target flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {detail ? (
              <div className="mt-2 space-y-2">
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground">Keluhan</p>
                  <p className="line-clamp-3 mt-0.5 text-xs leading-relaxed text-foreground">{detail.condition}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground">Terapi</p>
                  <p className="line-clamp-2 mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {detail.therapyMethod}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                Area ini disebut pada diagnosis sesi terpilih.
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                onRegionSelect?.(activeMarker);
                setActiveId(null);
              }}
              className="mt-2.5 inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-full bg-[var(--hafta-950)] px-3 text-xs font-semibold text-white transition-colors hover:bg-[var(--hafta-900)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
            >
              Lihat Detail Sesi
            </button>
          </div>
        </div>
      ) : null}

      {/* fallback bila belum ada area — di luar kanvas, tidak ikut zoom/pan */}
      {markers.length === 0 ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
          <p className="max-w-[80%] rounded-full border border-slate-200/80 bg-white/90 px-3 py-1.5 text-center text-[10px] leading-snug text-muted-foreground shadow-sm backdrop-blur">
            {fallbackHint}
          </p>
        </div>
      ) : null}

      {/* legenda nada penanda — sinyal ganda: warna + teks */}
      {markers.length > 0 ? (
        <div className="pointer-events-none absolute left-4 top-4 max-w-[70%] rounded-full border border-slate-200/80 bg-white/90 px-3 py-1.5 shadow-sm backdrop-blur">
          <p className="flex flex-wrap items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
            <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${TONE_DOT[tone]}`} />
            <span>
              {markers.length} area keluhan · nada nyeri sesi
              <span
                className={cn(
                  'ml-1 font-semibold',
                  tone === 'alert' ? 'text-[var(--hafta-red-700)]' : 'text-foreground',
                )}
              >
                {TONE_LABEL[tone]}
              </span>
            </span>
          </p>
        </div>
      ) : null}

      {/* ── kontrol kanvas ── */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1 rounded-full border border-slate-200/80 bg-white/90 p-1 shadow-sm backdrop-blur">
        <button
          type="button"
          aria-label="Reset tampilan"
          onClick={resetView}
          className="tap-target flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Mode pointer pilih"
          aria-pressed={pointerMode}
          onClick={() => setPointerMode((mode) => !mode)}
          className={cn(
            'tap-target flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35',
            pointerMode ? 'bg-[#111827] text-white' : 'text-muted-foreground hover:bg-slate-100 hover:text-foreground',
          )}
        >
          <MousePointer2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Perbesar"
          onClick={zoomIn}
          className="tap-target flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Perkecil"
          onClick={zoomOut}
          className="tap-target flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}

function markerId(marker: DetectedRegion): string {
  return `${marker.key}:${marker.side ?? '-'}`;
}

/** Posisi x mengikuti sisi keluhan: kiri pasien = kanan gambar (tampilan depan). */
function regionPosition(marker: DetectedRegion): { x: number; y: number } {
  const position = BODY_REGION_IMAGE_POSITIONS[marker.key];
  const x = marker.side === 'kiri' && position.altX !== undefined ? position.altX : position.x;
  return { x, y: position.y };
}

function regionLabel(marker: DetectedRegion): string {
  const base = REGION_POINTS[marker.key].label;
  return marker.side ? `${base} ${marker.side}` : base;
}
