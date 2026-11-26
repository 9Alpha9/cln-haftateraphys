'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, FlipHorizontal2, HeartPulse, Layers, Maximize2, Minimize2, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnatomySystemMenu } from '@/components/patient/anatomy-system-menu';
import { SkeletonBlock } from '@/components/dashboard/skeletons/skeleton-primitives';
import { LifelineLoader } from '@/components/animate-ui/lifeline-loader';
import { REGION_POINTS, type DetectedRegion } from '@/components/patient/body-condition-map';
import {
  ANATOMY_SYSTEMS,
  atlasAsset,
  markerPosition,
  type AnatomySystemKey,
  type AnatomyViewKey,
} from '@/components/patient/body-anatomy-atlas';

const ZOOM_MIN = 1;
const ZOOM_MAX = 4;
const ZOOM_STEP = 1.25;
/** Batas geser: gambar boleh bergeser maksimal setengah lebar/tinggi ekstra. */
const PAN_MARGIN = 80;

type Tone = 'good' | 'watch' | 'alert';

const TONE_DOT: Record<Tone, string> = {
  good: 'bg-[var(--hafta-grn-500)]',
  watch: 'bg-[var(--hafta-300)]',
  alert: 'bg-[var(--hafta-red-500)]',
};

const TONE_TEXT: Record<Tone, string> = {
  good: 'text-[var(--hafta-grn-500)]',
  watch: 'text-[var(--hafta-300)]',
  alert: 'text-[var(--hafta-red-500)]',
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
 * Atlas anatomi interaktif — Canvas 2D ringan (tanpa WebGL).
 *
 * - Aset WebP `/assets/body-anatomy/`, dimuat lazy per aset aktif + cache
 *   sesi (aset yang belum dilihat tidak dimuat).
 * - Default: muscular anterior, fit-to-container, seluruh tubuh terlihat,
 *   rasio aspek asli, tanpa clipping.
 * - Pan (grab/drag), pinch dua jari, zoom tombol, reset, fullscreen.
 * - Penanda = tombol DOM asli (fokus & target sentuh terjamin); posisinya
 *   dihitung dari transform kanvas sehingga tidak bergeser saat zoom/pan/
 *   resize/fullscreen, tetapi ukurannya konstan di layar.
 * - Klik kanan ditekan di permukaan viewer saja (bukan seluruh aplikasi).
 */
export function TherapyAnatomyStage({
  markers,
  tone,
  detail,
  onRegionSelect,
  onActiveMarkerChange,
  focusRegionId,
  fallbackHint,
}: {
  markers: DetectedRegion[];
  tone: Tone;
  detail: AnatomyAreaDetail | null;
  onRegionSelect?: (region: DetectedRegion) => void;
  /** Sinkronisasi pilihan penanda dengan daftar area keluhan di luar viewer. */
  onActiveMarkerChange?: (markerId: string | null) => void;
  /** Id penanda yang diaktifkan dari luar (daftar area keluhan). */
  focusRegionId: string | null;
  fallbackHint: string;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [system, setSystem] = useState<AnatomySystemKey>('muscular');
  const [view, setView] = useState<AnatomyViewKey>('anterior');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenContainer, setFullscreenContainer] = useState<HTMLElement | null>(null);
  const [legendExpanded, setLegendExpanded] = useState(false);
  const [imageReady, setImageReady] = useState(0);
  const [loadedAssetId, setLoadedAssetId] = useState<string | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  const asset = atlasAsset(system, view);
  const systemEntry = ANATOMY_SYSTEMS.find((item) => item.key === system);

  const sectionRef = useRef<HTMLElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGLineElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  /** Cache aset yang sudah pernah dilihat — aset lain tetap tidak dimuat. */
  const imageCache = useRef(new Map<string, HTMLImageElement>());
  /** Id area terakhir yang garisnya dianimasikan — animasi hanya sekali per pilihan. */
  const lineAnimatedFor = useRef<string | null>(null);

  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const panStartRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const pinchStartRef = useRef<{
    dist: number;
    zoom: number;
    midX: number;
    midY: number;
    panX: number;
    panY: number;
  } | null>(null);
  const movedRef = useRef(0);

  const activeMarker = markers.find((marker) => markerId(marker) === activeId) ?? null;

  /**
   * Aktivasi penanda dari daftar area keluhan (kolom kanan).
   * Pola render-adjust (bukan effect): state disesuaikan saat prop berubah,
   * tanpa setState-in-effect.
   */
  const [lastFocusRegionId, setLastFocusRegionId] = useState<string | null>(focusRegionId);
  if (focusRegionId !== lastFocusRegionId) {
    setLastFocusRegionId(focusRegionId);
    if (focusRegionId) setActiveId(focusRegionId);
  }

  const selectMarker = useCallback(
    (id: string | null) => {
      setActiveId(id);
      onActiveMarkerChange?.(id);
    },
    [onActiveMarkerChange],
  );

  /** Muat HANYA aset aktif (lazy); aset yang pernah dimuat disimpan di cache. */
  useEffect(() => {
    let cancelled = false;
    const cached = imageCache.current.get(asset.id);
    if (cached) {
      imageRef.current = cached;
      setLoadedAssetId(asset.id);
      setImageReady((value) => value + 1);
      return () => {
        cancelled = true;
      };
    }
    const image = new Image();
    image.decoding = 'async';
    image.src = asset.url;
    const onLoad = () => {
      if (cancelled) return;
      imageCache.current.set(asset.id, image);
      imageRef.current = image;
      setLoadedAssetId(asset.id);
      setImageReady((value) => value + 1);
    };
    image.addEventListener('load', onLoad);
    image.addEventListener('error', onLoad);
    return () => {
      cancelled = true;
      image.removeEventListener('load', onLoad);
      image.removeEventListener('error', onLoad);
    };
  }, [asset]);

  /** Ukuran kanvas mengikuti kontainer (resize + fullscreen). */
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const measure = () => {
      const rect = wrap.getBoundingClientRect();
      setSize({ w: rect.width, h: rect.height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  const layout = useMemo(() => {
    if (!size) return null;
    const fit = Math.min((size.w * 0.94) / asset.width, (size.h * 0.94) / asset.height);
    const scale = fit * zoom;
    return {
      cx: size.w / 2 + pan.x,
      cy: size.h / 2 + pan.y,
      w: asset.width * scale,
      h: asset.height * scale,
    };
  }, [asset, size, zoom, pan]);

  const clampPan = useCallback(
    (next: { x: number; y: number }) => {
      if (!layout) return next;
      const maxX = Math.max(0, (layout.w - (size?.w ?? 0)) / 2 + PAN_MARGIN);
      const maxY = Math.max(0, (layout.h - (size?.h ?? 0)) / 2 + PAN_MARGIN);
      return { x: Math.min(maxX, Math.max(-maxX, next.x)), y: Math.min(maxY, Math.max(-maxY, next.y)) };
    },
    [layout, size],
  );

  /** Render aset ke kanvas (DPR-aware) — bukan <img> konvensional. */
  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !layout || !size) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(size.w * dpr);
    canvas.height = Math.round(size.h * dpr);
    canvas.style.width = `${size.w}px`;
    canvas.style.height = `${size.h}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.w, size.h);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, layout.cx - layout.w / 2, layout.cy - layout.h / 2, layout.w, layout.h);
  }, [layout, size, imageReady]);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const zoomBy = useCallback((factor: number) => {
    setZoom((current) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, current * factor)));
  }, []);

  const toggleFullscreen = useCallback(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void section.requestFullscreen?.().catch(() => {
        // Browser menolak (mis. iframe tanpa allow) — viewer tetap dipakai inline.
      });
    }
  }, []);

  useEffect(() => {
    const onChange = () => {
      const el = document.fullscreenElement;
      setIsFullscreen(Boolean(el));
      setFullscreenContainer(el instanceof HTMLElement ? el : null);
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  /** Ganti sistem → tampakan yang tidak tersedia kembali ke anterior. */
  const selectSystem = (next: AnatomySystemKey) => {
    setSystem(next);
    const entry = ANATOMY_SYSTEMS.find((item) => item.key === next);
    if (view === 'posterior' && !entry?.posterior) setView('anterior');
  };

  const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as Element;
    if (target.closest('[data-stage-hotspot]') || target.closest('[data-stage-popover]')) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    movedRef.current = 0;
    const count = pointersRef.current.size;
    if (count === 1) {
      panStartRef.current = { x: event.clientX, y: event.clientY, ox: pan.x, oy: pan.y };
    } else if (count === 2) {
      const [first, second] = Array.from(pointersRef.current.values());
      pinchStartRef.current = {
        dist: Math.max(1, distance(first, second)),
        zoom,
        midX: (first.x + second.x) / 2,
        midY: (first.y + second.y) / 2,
        panX: pan.x,
        panY: pan.y,
      };
      panStartRef.current = null;
    }
    setDragging(true);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer sudah tidak aktif — pan tetap berjalan lewat ref.
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const pointers = pointersRef.current;
    const previous = pointers.get(event.pointerId);
    if (!previous) return;
    movedRef.current += Math.hypot(event.clientX - previous.x, event.clientY - previous.y);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.size === 2 && pinchStartRef.current) {
      const [first, second] = Array.from(pointers.values());
      const dist = Math.max(1, distance(first, second));
      const midX = (first.x + second.x) / 2;
      const midY = (first.y + second.y) / 2;
      const start = pinchStartRef.current;
      setZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, (start.zoom * dist) / start.dist)));
      setPan(
        clampPan({
          x: start.panX + (midX - start.midX),
          y: start.panY + (midY - start.midY),
        }),
      );
      return;
    }
    if (pointers.size === 1 && panStartRef.current) {
      const start = panStartRef.current;
      setPan(clampPan({ x: start.ox + (event.clientX - start.x), y: start.oy + (event.clientY - start.y) }));
    }
  };

  const endPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const pointers = pointersRef.current;
    const hadPointer = pointers.has(event.pointerId);
    pointers.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (pointers.size === 1) {
      const [only] = Array.from(pointers.values());
      if (only) panStartRef.current = { x: only.x, y: only.y, ox: pan.x, oy: pan.y };
      pinchStartRef.current = null;
    }
    if (pointers.size === 0) {
      pinchStartRef.current = null;
      panStartRef.current = null;
      setDragging(false);
      // Ketukan singkat di latar (bukan penanda) menutup popover.
      if (hadPointer && movedRef.current < 6) selectMarker(null);
    }
  };

  /**
   * Klem posisi popover + gambarkan garis penunjuk (pin → kartu) langsung ke
   * DOM di useLayoutEffect — sebelum paint, tanpa re-render — sehingga popover
   * tidak pernah terpotong dan garis otomatis "menunjuk" di semua level zoom.
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
  }, [activeMarker, activeId, zoom, pan, size, isFullscreen]);

  const cursorClass = dragging ? 'cursor-grabbing' : 'cursor-grab';

  return (
    <section
      ref={sectionRef}
      aria-label="Atlas anatomi interaktif"
      onContextMenu={(event) => event.preventDefault()}
      className={cn(
        'relative overflow-hidden rounded-[28px]',
        isFullscreen ? 'h-screen w-screen rounded-none bg-white' : 'min-h-[560px] sm:min-h-[640px]',
      )}
    >
      {/* ── kanvas: gambar di-render Canvas 2D, drag = pan, pinch = zoom ── */}
      <div
        ref={wrapRef}
        className={cn('absolute inset-0 select-none', cursorClass)}
        style={{ touchAction: zoom > 1 ? 'none' : 'pan-y' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onWheel={(event) => {
          // Pinch trackpad (ctrl+wheel) = zoom; scroll biasa tetap menggulir halaman.
          if (!event.ctrlKey && !event.metaKey) return;
          event.preventDefault();
          zoomBy(event.deltaY < 0 ? 1.08 : 1 / 1.08);
        }}
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Atlas anatomi — ${systemEntry?.label ?? 'otot'} tampak ${view === 'anterior' ? 'depan' : 'belakang'}`}
          className="block h-full w-full"
        />

        {/* ── penanda area keluhan: tombol DOM, ukuran konstan di semua zoom ── */}
        {layout
          ? markers.map((marker) => {
              const position = markerPosition(asset.id, marker.key, marker.side);
              const label = regionLabel(marker);
              const isActive = activeId === markerId(marker);
              // Label keluar dari sumbu tubuh: pin di kiri → label ke kanan,
              // pin di kanan → label ke kiri. Garis penunjuk jadi sejajar dan
              // tidak pernah menyilang tubuh/titik lain.
              const pillRight = position.x <= 50;
              return (
                <div
                  key={markerId(marker)}
                  className="absolute z-10"
                  style={{
                    left: layout.cx - layout.w / 2 + (position.x / 100) * layout.w,
                    top: layout.cy - layout.h / 2 + (position.y / 100) * layout.h,
                  }}
                >
                  <button
                    type="button"
                    data-stage-hotspot
                    data-hotspot-id={markerId(marker)}
                    aria-label={`Area keluhan: ${label}`}
                    aria-expanded={isActive}
                    title={label}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      selectMarker(isActive ? null : markerId(marker));
                    }}
                    className={cn(
                      'absolute top-0 flex -translate-y-1/2 cursor-pointer items-center rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FACC15]/50',
                      pillRight ? 'left-0 flex-row' : 'left-0 flex-row-reverse -translate-x-full',
                    )}
                  >
                    {/* titik pin — selalu di koordinat anatomi */}
                    <span className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center">
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
                    {/* garis penunjuk: satu segmen pendek, sejajar sumbu horizontal.
                        Disembunyikan saat pin aktif karena popover menggantikannya. */}
                    {isActive ? null : (
                      <>
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 16 2"
                          className="h-0.5 w-4 shrink-0 overflow-visible"
                          preserveAspectRatio="none"
                        >
                          <line
                            x1={0}
                            y1={1}
                            x2={16}
                            y2={1}
                            stroke="#94A3B8"
                            strokeWidth={1.5}
                            strokeLinecap="round"
                            vectorEffect="non-scaling-stroke"
                          />
                        </svg>
                        <span
                          className={cn(
                            'flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-slate-200 bg-white/95 px-2 py-0.5 text-[9px] font-semibold leading-4 text-slate-700 shadow-sm backdrop-blur',
                          )}
                        >
                          <span
                            aria-hidden="true"
                            className={cn('h-1.5 w-1.5 shrink-0 rounded-full', TONE_DOT[tone])}
                          />
                          {label}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          : null}
      </div>

      {/* ── loading aset atlas: skeleton global + LifelineLoader global (sama seperti PDF viewer) ── */}
      {loadedAssetId !== asset.id ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-white/80 backdrop-blur-sm">
          <SkeletonBlock className="h-3/5 w-1/2 max-w-[220px] rounded-[40px] bg-slate-200/70" />
          <LifelineLoader label="Memuat atlas anatomi…" />
        </div>
      ) : null}

      {/* ── garis penunjuk pin → kartu (animasi menggambar dirinya) ── */}
      {activeMarker ? (
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible">
          <line
            ref={lineRef}
            x1={0}
            y1={0}
            x2={0}
            y2={0}
            stroke="#FFFFFF"
            strokeWidth={1.5}
            strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 1px 1px rgba(100,116,139,0.45))' }}
          />
          <circle
            ref={dotRef}
            cx={0}
            cy={0}
            r={2.5}
            fill="#FFFFFF"
            opacity={0}
            style={{ filter: 'drop-shadow(0 1px 1px rgba(100,116,139,0.45))' }}
          />
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
                onClick={() => selectMarker(null)}
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
                selectMarker(null);
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

      {/* legenda nada penanda — ringkas saat diam, memanjang saat diklik */}
      {markers.length > 0 ? (
        <button
          type="button"
          onClick={() => setLegendExpanded((prev) => !prev)}
          aria-expanded={legendExpanded}
          aria-label={`${markers.length} area keluhan · nada nyeri sesi ${TONE_LABEL[tone]}`}
          title="Klik untuk melihat detail nada nyeri sesi"
          className="absolute left-4 top-4 z-20 max-w-[75%] cursor-pointer rounded-full border border-slate-200/70 bg-white/70 px-3 py-1.5 text-left shadow-sm backdrop-blur-md transition-all hover:bg-white/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
        >
          <span className="flex flex-wrap items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
            <HeartPulse aria-hidden="true" className={`h-3.5 w-3.5 shrink-0 ${TONE_TEXT[tone]}`} />
            {legendExpanded ? (
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
            ) : (
              <span className="font-semibold text-foreground">{markers.length} area</span>
            )}
            <ChevronRight
              aria-hidden="true"
              className={cn(
                'h-3 w-3 shrink-0 text-muted-foreground transition-transform duration-200',
                // collapsed: panah ke depan (kanan); expanded: kebalikannya (atas)
                legendExpanded ? '-rotate-90' : 'rotate-0',
              )}
            />
          </span>
        </button>
      ) : null}

      {/* ── pemilih sistem + tampakan: rail vertikal kompak di sisi KIRI kanvas ── */}
      <AnatomySystemMenu
        system={system}
        view={view}
        container={fullscreenContainer}
        onSelectSystem={selectSystem}
        onToggleView={() => setView((current) => (current === 'anterior' ? 'posterior' : 'anterior'))}
      />
      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1 rounded-full border border-border bg-popover p-1 shadow-sm">
        <button
          type="button"
          aria-label="Reset tampilan"
          title="Reset tampilan"
          onClick={resetView}
          className="tap-target flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Perbesar"
          title="Perbesar"
          onClick={() => zoomBy(ZOOM_STEP)}
          className="tap-target flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Perkecil"
          title="Perkecil"
          onClick={() => zoomBy(1 / ZOOM_STEP)}
          disabled={zoom <= ZOOM_MIN}
          className="tap-target flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label={isFullscreen ? 'Keluar layar penuh' : 'Layar penuh'}
          title={isFullscreen ? 'Keluar layar penuh' : 'Layar penuh'}
          aria-pressed={isFullscreen}
          onClick={toggleFullscreen}
          className="tap-target flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>
    </section>
  );
}

function markerId(marker: DetectedRegion): string {
  return `${marker.key}:${marker.side ?? '-'}`;
}

function regionLabel(marker: DetectedRegion): string {
  const base = REGION_POINTS[marker.key].label;
  return marker.side ? `${base} ${marker.side}` : base;
}
