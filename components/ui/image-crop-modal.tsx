'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import { useOverlayLayer } from '@/components/ui/use-overlay-layer';
import { useBodyScrollLock } from '@/components/ui/use-body-scroll-lock';
import { cn } from '@/lib/utils';

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const DEFAULT_OUTPUT_SIZE = 512;

type ImageSize = { width: number; height: number };
type ImageOffset = { x: number; y: number };
type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

export type ImageCropModalProps = {
  isOpen: boolean;
  imageSrc: string | null;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  outputSize?: number;
  /** Aspect ratio of the crop area. Profile photos use 1 (square). */
  aspectRatio?: number;
  onCancel: () => void;
  onConfirm: (croppedDataUrl: string) => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

type CropEditorProps = {
  imageSrc: string;
  outputSize: number;
  aspectRatio: number;
  confirmLabel: string;
  cancelLabel: string;
  onCancel: () => void;
  onConfirm: (croppedDataUrl: string) => void;
};

function CropEditor({
  imageSrc,
  outputSize,
  aspectRatio,
  confirmLabel,
  cancelLabel,
  onCancel,
  onConfirm,
}: CropEditorProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [viewport, setViewport] = useState<ImageSize>({ width: 0, height: 0 });
  const [natural, setNatural] = useState<ImageSize | null>(null);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState<ImageOffset>({ x: 0, y: 0 });
  const [drag, setDrag] = useState<DragState | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ResizeObserver fires immediately after observe, so the initial size is captured
  // without setting state synchronously from inside the effect body.
  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect && rect.width > 0 && rect.height > 0) {
        setViewport({ width: rect.width, height: rect.height });
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      if (!image.naturalWidth || !image.naturalHeight) {
        setError('Foto tidak dapat dibaca. Coba pilih file lain.');
        return;
      }
      setNatural({ width: image.naturalWidth, height: image.naturalHeight });
      setReady(true);
    };
    image.onerror = () => setError('Foto tidak dapat dibaca. Coba pilih file lain.');
    image.src = imageSrc;

    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [imageSrc]);

  const baseScale =
    natural && viewport.width > 0 && viewport.height > 0
      ? Math.max(viewport.width / natural.width, viewport.height / natural.height)
      : 0;
  const displayScale = baseScale * zoom;
  const displayWidth = natural ? natural.width * displayScale : 0;
  const displayHeight = natural ? natural.height * displayScale : 0;
  const left = viewport.width / 2 - displayWidth / 2 + offset.x;
  const top = viewport.height / 2 - displayHeight / 2 + offset.y;

  const clampOffset = useCallback(
    (next: ImageOffset, nextZoom: number): ImageOffset => {
      if (!natural || viewport.width === 0 || viewport.height === 0) return next;
      const scale =
        Math.max(viewport.width / natural.width, viewport.height / natural.height) * nextZoom;
      const maxX = Math.max(0, (natural.width * scale - viewport.width) / 2);
      const maxY = Math.max(0, (natural.height * scale - viewport.height) / 2);
      return {
        x: clamp(next.x, -maxX, maxX),
        y: clamp(next.y, -maxY, maxY),
      };
    },
    [natural, viewport.height, viewport.width],
  );

  function changeZoom(nextZoom: number) {
    const safeZoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
    setZoom(safeZoom);
    setOffset((current) => clampOffset(current, safeZoom));
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!ready) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
    });
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    setOffset(
      clampOffset(
        {
          x: drag.originX + (event.clientX - drag.startX),
          y: drag.originY + (event.clientY - drag.startY),
        },
        zoom,
      ),
    );
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (drag && drag.pointerId === event.pointerId) {
      setDrag(null);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    }
  }

  function handleConfirm() {
    const image = imageRef.current;
    if (!image || !natural || displayScale <= 0) {
      setError('Foto belum siap. Coba tunggu sebentar lalu ulangi.');
      return;
    }

    const safeOutput = clamp(Math.round(outputSize), 128, 2048);
    const outputWidth = safeOutput;
    const outputHeight = Math.max(1, Math.round(safeOutput / aspectRatio));
    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      setError('Foto tidak dapat diproses pada perangkat ini.');
      return;
    }

    const cropWidth = viewport.width / displayScale;
    const cropHeight = viewport.height / displayScale;
    const sourceX = (viewport.width / 2 - left) / displayScale - cropWidth / 2;
    const sourceY = (viewport.height / 2 - top) / displayScale - cropHeight / 2;
    const safeSourceX = clamp(sourceX, 0, Math.max(0, natural.width - cropWidth));
    const safeSourceY = clamp(sourceY, 0, Math.max(0, natural.height - cropHeight));

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, outputWidth, outputHeight);
    context.drawImage(
      image,
      safeSourceX,
      safeSourceY,
      cropWidth,
      cropHeight,
      0,
      0,
      outputWidth,
      outputHeight,
    );

    onConfirm(canvas.toDataURL('image/jpeg', 0.92));
  }

  return (
    <>
      <div
        ref={viewportRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={cn(
          'relative mx-auto mt-4 w-full max-w-[320px] touch-none overflow-hidden rounded-2xl bg-stone-900',
          ready && (drag ? 'cursor-grabbing' : 'cursor-grab'),
        )}
        style={{ aspectRatio: String(aspectRatio) }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imageRef}
          src={imageSrc}
          alt="Pratinjau foto"
          draggable={false}
          className="pointer-events-none absolute max-w-none select-none"
          style={{
            width: displayWidth || undefined,
            height: displayHeight || undefined,
            left: displayWidth ? left : 0,
            top: displayHeight ? top : 0,
          }}
        />

        {/* Circular guide: the avatar is displayed as a circle across the app. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full -[0_0_0_9999px_rgba(24,23,0,0.35)] ring-2 ring-white/90 ring-inset"
        />

        {!ready && !error ? (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-stone-900/60 text-white">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-xs font-medium">Menyiapkan foto…</span>
          </div>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-4">
        <div className="flex items-center justify-between gap-2 text-xs font-semibold text-stone-500">
          <span className="inline-flex items-center gap-1.5">
            <ZoomOut className="h-3.5 w-3.5" />
            Perkecil
          </span>
          <span className="inline-flex items-center gap-1.5">
            Perbesar
            <ZoomIn className="h-3.5 w-3.5" />
          </span>
        </div>
        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.01}
          value={zoom}
          onChange={(event) => changeZoom(Number(event.target.value))}
          disabled={!ready}
          aria-label="Perbesaran foto"
          className="mt-2 h-1.5 w-full cursor-pointer accent-[#181700] disabled:cursor-not-allowed disabled:opacity-50"
        />
        <p className="mt-1.5 text-center text-[11px] text-stone-400">
          Geser foto di dalam lingkaran untuk mengatur posisi.
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-2 border-t border-stone-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!ready || Boolean(error)}
          className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--hafta-org-100)] px-4 text-xs font-bold text-[#181700]  transition-colors hover:bg-[var(--hafta-org-200)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[var(--hafta-org-100)] sm:h-11 sm:w-auto sm:px-5 sm:text-[13px]"
        >
          <Camera className="h-4 w-4 shrink-0" />
          {confirmLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-full border border-stone-200/90 bg-white px-4 text-xs font-semibold text-[#181700] transition-colors hover:bg-stone-100 sm:h-11 sm:w-auto sm:px-5 sm:text-[13px]"
        >
          {cancelLabel}
        </button>
      </div>
    </>
  );
}

export function ImageCropModal({
  isOpen,
  imageSrc,
  title = 'Atur Foto Profil',
  description = 'Geser foto untuk mengatur posisi, lalu perbesar atau perkecil sesuai kebutuhan.',
  confirmLabel = 'Gunakan Foto',
  cancelLabel = 'Batal',
  outputSize = DEFAULT_OUTPUT_SIZE,
  aspectRatio = 1,
  onCancel,
  onConfirm,
}: ImageCropModalProps) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const { isTopmost, zIndex } = useOverlayLayer(isOpen);
  useBodyScrollLock(isOpen);
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const frame = window.requestAnimationFrame(() => panelRef.current?.focus());
    return () => {
      window.cancelAnimationFrame(frame);
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isTopmost) {
        event.stopPropagation();
        onCancel();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isTopmost, onCancel]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="image-crop-modal"
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0.99 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
            aria-hidden="true"
          />

          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl border border-stone-200/70 bg-white p-4 -[0_18px_50px_rgba(24,23,0,0.18)] outline-none sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--hafta-org-50)] text-[#181700]">
                <Camera className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 id={titleId} className="text-base font-bold text-[#181700]">
                  {title}
                </h2>
                <p id={descriptionId} className="mt-1 text-xs leading-relaxed text-stone-500">
                  {description}
                </p>
              </div>
            </div>

            {imageSrc ? (
              <CropEditor
                key={imageSrc}
                imageSrc={imageSrc}
                outputSize={outputSize}
                aspectRatio={aspectRatio}
                confirmLabel={confirmLabel}
                cancelLabel={cancelLabel}
                onCancel={onCancel}
                onConfirm={onConfirm}
              />
            ) : null}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
