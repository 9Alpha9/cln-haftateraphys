'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PDFDocumentLoadingTask, PDFDocumentProxy, PDFPageProxy, RenderTask } from 'pdfjs-dist';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Minus,
  Plus,
  Printer,
  RotateCcw,
  TriangleAlert,
} from 'lucide-react';
import { LifelineLoader } from '@/components/animate-ui/lifeline-loader';
import { fetchPdfBytes, loadPdfWorkerUrl } from './pdf-document-cache';
import {
  clampPageIndex,
  clampZoom,
  fitToWidthCssWidth,
  needsRerender,
  pdfCanvasBitmapSize,
  pdfCanvasRatio,
} from './pdf-viewer-geometry';

type ViewerStatus = 'loading' | 'ready' | 'error';

/** Lebar maksimum halaman: sekitar A4 pada 96 dpi ×1,3 agar tetap terbaca. */
const MAX_PAGE_WIDTH = 768;
/** Batas render serentak; sisanya menunggu dan dibatalkan bila keluar layar. */
const MAX_CONCURRENT_RENDERS = 2;
/** Jarak prefetch: halaman dirender sebelum benar-benar masuk layar. */
const PREFETCH_MARGIN_PX = 600;

const CARD_CLASS =
  'mx-auto mb-3 block max-w-none rounded-lg border border-border bg-white shadow-[0_1px_2px_rgba(28,25,23,0.06)]';
const TOOL_BUTTON_CLASS =
  'inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50';
const ACTION_BASE_CLASS =
  'inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full px-3.5 text-xs font-semibold transition-colors';

type RenderedState = { quota: number; cssWidth: number; zoom: number };
type CanvasEntry = {
  canvas: HTMLCanvasElement;
  observer: IntersectionObserver | null;
  state: RenderedState | null;
  cancelledWhileRendering: boolean;
  /** Tugas render yang sedang memakai canvas ini (satu canvas = satu tugas). */
  task: RenderTask | null;
};

/**
 * Penampil PDF berbasis canvas (pdf.js) yang tidak bergantung pada plugin PDF
 * bawaan browser.
 *
 * Iframe PDF hanya bekerja bila browser punya viewer internal: iOS Safari tidak
 * menyediakan toolbar, dan sebagian browser Android (Firefox, Samsung Internet)
 * tidak merender PDF di iframe sama sekali. Dengan pdf.js, halaman digambar ke
 * `<canvas>` sehingga tampil sama di semua browser.
 *
 * Alasan desain penting:
 * - Ukuran bitmap dihitung dari **lebar CSS pada saat render**, dan canvas
 *   dirender ulang saat lebar wadah/zoom berubah. Canvas dengan atribut lebar
 *   tetap akan meluber saat layar diputar atau modal dibuka dengan lebar lain.
 * - Halaman 1 selalu dirender lebih dulu agar dokumen terlihat cepat; halaman
 *   lain dirender saat mendekati viewport, dan dibatalkan ketika keluar jauh
 *   dari viewport supaya dokumen panjang tetap hemat memori.
 * - Setiap render memiliki "kuota" (lebar CSS + zoom). KUOTA_DIBATALKAN
 *   mengalahkan semua kuota, sehingga render tertunda yang selesai belakangan
 *   tidak menimpa canvas dengan bitmap dari ukuran lama.
 * - Task render dibatalkan dan dokumen di-`destroy()` saat modal ditutup atau
 *   sumber berganti, agar tidak ada memory leak saat berpindah pasien.
 */
export function PdfCanvasViewer({
  src,
  fileName,
  workerSrc,
}: {
  src: string;
  fileName?: string;
  /** URL worker pdf.js hasil bundling; `null` = gunakan worker default pdf.js. */
  workerSrc: string | null;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const quotaRef = useRef(0);
  // Status disimpan bersama `src`-nya agar pergantian dokumen otomatis kembali
  // ke keadaan loading.
  const [viewer, setViewer] = useState<{ src: string | null; status: ViewerStatus; pages: number }>({
    src: null,
    status: 'loading',
    pages: 0,
  });
  const [zoom, setZoom] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [aspect, setAspect] = useState(1.414);
  const [containerWidth, setContainerWidth] = useState(0);

  const active = viewer.src === src;
  const status: ViewerStatus = active ? viewer.status : 'loading';
  const pageCount = active ? viewer.pages : 0;


  const scrollRef = useRef<HTMLDivElement | null>(null);
  // Mesin render disimpan di ref agar handler UI bisa memicunya tanpa restart.
  const engineRef = useRef<{
    entries: CanvasEntry[];
    scroller: HTMLDivElement | null;
    setQuota: () => void;
    updateLayout: () => void;
    refreshPage: () => void;
  }>({
    entries: [],
    scroller: null,
    setQuota: () => undefined,
    updateLayout: () => undefined,
    refreshPage: () => undefined,
  });

  const goToPage = useCallback((index: number) => {
    const { entries, scroller } = engineRef.current;
    if (!scroller) return;
    const target = entries[clampPageIndex(index, entries.length)]?.canvas;
    if (!target) return;
    scroller.scrollTo({ top: target.offsetTop - 8, behavior: 'smooth' });
  }, []);

  /**
   * Perilaku mesin render (bukan data). Disimpan terpisah dari `engineRef` supaya
   * efek tidak menulis properti pada hasil `useRef().current` (aturan React
   * Compiler: nilai yang diteruskan ke hook tidak boleh dimodifikasi).
   */
  const behaviourRef = useRef<{ updateLayout: () => void }>({ updateLayout: () => undefined });

  // Lebar wadah diukur di klien; tanpa ini, lebar canvas tidak diketahui saat
  // SSR dan tidak ikut berubah saat orientasi perangkat berputar.
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const update = () => setContainerWidth(element.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Muat dokumen & bangun canvas template untuk setiap halaman.
  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    const restoreScroll = scrollRef.current;
    if (!container) return;

    const cleanups: Array<() => void> = [];
    const canvasEntries: CanvasEntry[] = [];
    const renderTasks = new Set<RenderTask>();
    const pageProxies = new Map<number, Promise<PDFPageProxy>>();
    const queue: HTMLCanvasElement[] = [];
    const queued = new Set<HTMLCanvasElement>();
    let running = 0;
    let pdfDocument: PDFDocumentProxy | null = null;
    let loadingTask: PDFDocumentLoadingTask | null = null;
    let ratio = pdfCanvasRatio(window.devicePixelRatio || 1);
    let activeQuota = -1;

    const cssWidthFor = (quota: number) =>
      Math.max(1, Math.round(fitToWidthCssWidth(container.clientWidth, 8, MAX_PAGE_WIDTH) * quota));

    /** Pasang daftar kanvas ke ref supaya handler UI bisa membacanya. */
    const publish = () => {
      engineRef.current.entries = canvasEntries;
    };
    cleanups.push(() => {
      engineRef.current.entries = [];
    });
    publish();

    const inViewport = (canvas: HTMLCanvasElement, margin: number) => {
      const scroller = scrollRef.current;
      if (!scroller) return false;
      const canvasRect = canvas.getBoundingClientRect();
      const scrollerRect = scroller.getBoundingClientRect();
      return canvasRect.top < scrollerRect.bottom + margin && canvasRect.bottom > scrollerRect.top - margin;
    };

    const pageFor = (pageNumber: number) => {
      if (!pdfDocument) return null;
      let proxy = pageProxies.get(pageNumber);
      if (!proxy) {
        proxy = pdfDocument.getPage(pageNumber);
        pageProxies.set(pageNumber, proxy);
      }
      return proxy;
    };

    const renderEntry = async (entry: CanvasEntry) => {
      const pageNumber = Number(entry.canvas.dataset.pageNumber ?? '0');
      if (!pageNumber || !pdfDocument) return;
      const quota = activeQuota;
      const width = cssWidthFor(quota);
      const proxy = pageFor(pageNumber);
      if (!proxy) return;
      const page = await proxy;
      if (cancelled || activeQuota !== quota) return;

      const base = page.getViewport({ scale: 1 });
      const bitmap = pdfCanvasBitmapSize(base, width, ratio);
      if (entry.canvas.width !== bitmap.width) entry.canvas.width = bitmap.width;
      if (entry.canvas.height !== bitmap.height) entry.canvas.height = bitmap.height;
      entry.canvas.style.width = `${width}px`;

      // pdf.js menolak dua render bersamaan pada canvas yang sama. Karena kuota
      // berubah (mis. modal dibuka dengan lebar lain), batalkan tugas lama dan
      // tunggu benar-benar berhenti sebelum memulai tugas baru.
      if (entry.task) {
        const previous = entry.task;
        entry.task = null;
        try {
          previous.cancel();
          await previous.promise;
        } catch {
          // dibatalkan: diharapkan
        }
        if (cancelled) return;
      }

      const task = page.render({ canvas: entry.canvas, viewport: page.getViewport({ scale: width / base.width }) });
      entry.task = task;
      renderTasks.add(task);
      try {
        await task.promise;
        if (cancelled || activeQuota !== quota) {
          // Hasil dari kuota lama: jangan menandai canvas sebagai siap.
          entry.cancelledWhileRendering = true;
          entry.state = null;
          entry.canvas.dataset.rendered = 'false';
          if (!cancelled) requestRender(entry, true);
          return;
        }
        entry.cancelledWhileRendering = false;
        entry.state = { quota, cssWidth: width, zoom };
        entry.canvas.dataset.rendered = 'true';
        if (pageNumber === 1) setViewer({ src, status: 'ready', pages: pdfDocument.numPages });
      } catch (error) {
        const errorName = error instanceof Error ? error.name : '';
        if (errorName === 'RenderingCancelledException' || cancelled) {
          entry.cancelledWhileRendering = !cancelled;
          return;
        }
        entry.canvas.dataset.rendered = 'true';
        entry.canvas.dataset.failed = 'true';
        setViewer((previous) =>
          previous.status === 'ready' ? previous : { src, status: 'error', pages: 0 },
        );
        console.error(
          '[pdf-viewer] gagal merender halaman',
          error instanceof Error ? error.message : 'unknown',
        );
      } finally {
        if (entry.task === task) entry.task = null;
        renderTasks.delete(task);
      }
    };

    const pump = () => {
      while (running < MAX_CONCURRENT_RENDERS && queue.length > 0) {
        const canvas = queue.shift();
        if (!canvas) break;
        queued.delete(canvas);
        const entry = canvasEntries.find((item) => item.canvas === canvas);
        if (!entry) continue;
        running += 1;
        void renderEntry(entry).finally(() => {
          running -= 1;
          pump();
        });
      }
    };

    const requestRender = (entry: CanvasEntry, priority = false) => {
      if (cancelled || !pdfDocument) return;
      const quota = activeQuota;
      if (quota < 0) return;
      const shouldRender =
        entry.cancelledWhileRendering ||
        needsRerender(entry.state ?? undefined, cssWidthFor(quota), zoom);
      if (!shouldRender) return;
      entry.cancelledWhileRendering = false;
      if (queued.has(entry.canvas)) return;
      entry.canvas.dataset.rendered = 'false';
      queued.add(entry.canvas);
      if (priority) queue.unshift(entry.canvas);
      else queue.push(entry.canvas);
      pump();
    };

    const cancelRender = (entry: CanvasEntry) => {
      const index = queue.indexOf(entry.canvas);
      if (index >= 0) queue.splice(index, 1);
      queued.delete(entry.canvas);
      if (entry.task) {
        entry.task.cancel();
        entry.task = null;
      }
      entry.cancelledWhileRendering = false;
    };

    /**
     * Samakan kanvas dengan lebar wadah & zoom saat ini.
     *
     * Dipanggil saat pertama kali halaman dibangun dan setiap kali wadah/zoom
     * berubah (rotasi layar, modal dibuka dengan lebar lain, tombol zoom).
     * Kanvas yang sudah sesuai tidak disentuh, jadi perubahan kecil tidak
     * memicu render ulang seluruh dokumen.
     */
    const updateLayout = (force = false) => {
      const quota = quotaRef.current;
      const width = cssWidthFor(quota);
      const manual = quota !== 1;
      const entries = canvasEntries;
      const mismatched = entries.filter(
        (entry) => entry.state && entry.state.cssWidth !== width,
      );
      const pendingWork = queue.length > 0 || running > 0;
      if (!force && manual && !pendingWork && mismatched.length === 0) return;

      activeQuota = quota;
      queue.length = 0;
      queued.clear();
      entries.forEach((entry) => {
        const aligned =
          entry.state &&
          Math.abs(entry.state.cssWidth - width) / width <= 0.02 &&
          Math.abs(entry.state.zoom - quota) < 1e-6;
        if (aligned) {
          entry.canvas.style.width = `${width}px`;
          return;
        }
        entry.cancelledWhileRendering = false;
        entry.canvas.style.width = `${width}px`;
        entry.canvas.dataset.rendered = 'false';
        if (inViewport(entry.canvas, PREFETCH_MARGIN_PX)) requestRender(entry, true);
      });
    };
    engineRef.current.setQuota = () => updateLayout();
    engineRef.current.updateLayout = () => updateLayout(true);
    engineRef.current.refreshPage = () => {
      const entry = canvasEntries[clampPageIndex(currentPage - 1, canvasEntries.length)];
      if (entry) requestRender(entry, true);
    };
    engineRef.current.scroller = scrollRef.current;
    behaviourRef.current.updateLayout = () => updateLayout(true);

    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      setZoom((previous) => clampZoom(previous + (event.deltaY > 0 ? -0.1 : 0.1)));
    };
    restoreScroll?.addEventListener('wheel', onWheel, { passive: false });
    cleanups.push(() => restoreScroll?.removeEventListener('wheel', onWheel));

    void (async () => {
      try {
        const pdfjsPromise = import('pdfjs-dist');
        const bytesPromise = fetchPdfBytes(src);
        const workerPromise = workerSrc ? loadPdfWorkerUrl(workerSrc) : null;

        const pdfjs = await pdfjsPromise;
        // Muat worker lebih dulu agar kegagalannya jelas sebelum parsing.
        const workerUrl = await workerPromise;
        if (workerUrl) pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
        else
          pdfjs.GlobalWorkerOptions.workerSrc = new URL(
            'pdfjs-dist/build/pdf.worker.min.mjs',
            import.meta.url,
          ).toString();
        if (cancelled) return;

        // pdf.js memindahkan (transfer) buffer ke worker sehingga buffer asal
        // menjadi detached. Kirim salinan agar cache byte tetap bisa dipakai.
        const data = new Uint8Array((await bytesPromise).slice(0));
        loadingTask = pdfjs.getDocument({ data });
        pdfDocument = await loadingTask.promise;
        if (cancelled) {
          // `destroy()` pada loading task juga menghentikan worker pdf.js.
          void loadingTask.destroy();
          return;
        }

        if (typeof IntersectionObserver === 'undefined') {
          throw new Error('IntersectionObserver tidak tersedia');
        }

        const firstPage = await pageFor(1);
        if (!firstPage) return;
        if (cancelled) return;
        const firstBase = firstPage.getViewport({ scale: 1 });
        setAspect(firstBase.height / firstBase.width);

        activeQuota = quotaRef.current;
        const width = cssWidthFor(activeQuota);
        const bitmap = pdfCanvasBitmapSize(firstBase, width, ratio);

        for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
          if (cancelled) return;
          const canvas = document.createElement('canvas');
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          canvas.dataset.pageNumber = String(pageNumber);
          canvas.style.width = `${width}px`;
          canvas.style.height = 'auto';
          canvas.setAttribute('role', 'img');
          canvas.setAttribute('aria-label', `Halaman ${pageNumber} dari ${pdfDocument.numPages}`);
          canvas.className = CARD_CLASS;
          container.appendChild(canvas);

          const entry: CanvasEntry = {
            canvas,
            observer: null,
            state: null,
            cancelledWhileRendering: false,
            task: null,
          };
          canvasEntries.push(entry);

          if (pageNumber === 1) {
            requestRender(entry, true);
            continue;
          }
          const observer = new IntersectionObserver(
            (entries) => {
              for (const item of entries) {
                const target = item.target as HTMLCanvasElement;
                const observed = canvasEntries.find((value) => value.canvas === target);
                if (!observed) continue;
                if (item.isIntersecting) requestRender(observed);
                else if (observed.state === null) cancelRender(observed);
              }
            },
            { root: scrollRef.current, rootMargin: `${PREFETCH_MARGIN_PX}px 0px` },
          );
          observer.observe(canvas);
          entry.observer = observer;
          cleanups.push(() => observer.disconnect());
        }

        setViewer({ src, status: 'loading', pages: pdfDocument.numPages });
        // Setelah semua kanvas dibangun, samakan dengan lebar wadah saat ini.
        updateLayout();
      } catch (error) {
        if (!cancelled) {
          setViewer({ src, status: 'error', pages: 0 });
          console.error(
            '[pdf-viewer] gagal memuat dokumen',
            error instanceof Error ? error.message : 'unknown',
          );
        }
      }
    })();

    // Perubahan orientasi/perbesaran teks browser: hitung ulang skala bitmap
    // supaya canvas tidak meluber dan tidak tampak buram.
    const onResize = () => {
      const nextRatio = pdfCanvasRatio(window.devicePixelRatio || 1);
      if (nextRatio !== ratio) {
        ratio = nextRatio;
        canvasEntries.forEach((entry) => {
          entry.state = null;
        });
        updateLayout(true);
      }
    };
    window.addEventListener('resize', onResize);
    cleanups.push(() => window.removeEventListener('resize', onResize));

    return () => {
      cancelled = true;
      cleanups.forEach((cleanup) => cleanup());
      queue.length = 0;
      queued.clear();
      canvasEntries.forEach((entry) => {
        entry.task?.cancel();
        entry.observer?.disconnect();
      });
      renderTasks.forEach((task) => task.cancel());
      pageProxies.forEach((proxy) => {
        void proxy
          .then((page) => page.cleanup())
          .catch(() => undefined);
      });
      if (loadingTask) void loadingTask.destroy();
    };
    // `zoom` sengaja tidak menjadi dependency: perubahan zoom ditangani lewat
    // effect lain yang hanya memperbarui kuota, tanpa memuat ulang dokumen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, workerSrc]);

  // Zoom berubah → kuota baru. Dokumen tidak dimuat ulang.
  useEffect(() => {
    quotaRef.current = zoom;
    behaviourRef.current.updateLayout();
    setCurrentPage((previous) => clampPageIndex(previous - 1, engineRef.current.entries.length) + 1);
  }, [zoom]);

  // Lebar wadah berubah (rotasi layar / modal resize) → skala ulang bitmap.
  useEffect(() => {
    if (containerWidth <= 0) return;
    behaviourRef.current.updateLayout();
  }, [containerWidth]);

  // Lacak halaman aktif untuk indikator "Halaman X dari Y".
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const onScroll = () => {
      const entries = engineRef.current.entries;
      if (entries.length === 0) return;
      const scrollerRect = scroller.getBoundingClientRect();
      let closest = 0;
      let best = Number.POSITIVE_INFINITY;
      entries.forEach((entry, index) => {
        const distance = Math.abs(entry.canvas.getBoundingClientRect().top - scrollerRect.top);
        if (distance < best) {
          best = distance;
          closest = index;
        }
      });
      setCurrentPage((previous) => (previous === closest + 1 ? previous : closest + 1));
    };
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => scroller.removeEventListener('scroll', onScroll);
  }, [status]);

  const hasPages = pageCount > 0;
  const atFirst = currentPage <= 1;
  const atLast = currentPage >= pageCount;

  return (
    <div className="flex h-full min-h-0 flex-col bg-stone-100">
      <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-border bg-background px-2 py-1.5 sm:gap-2 sm:px-3 sm:py-2">
        <a
          href={src}
          download={fileName}
          className={`${ACTION_BASE_CLASS} bg-[var(--hafta-300)] px-3.5 font-bold text-foreground hover:bg-[var(--hafta-400)]`}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          <span className="sm:hidden">Unduh</span>
          <span className="hidden sm:inline">Unduh PDF</span>
        </a>
        <button type="button" onClick={() => window.print()} disabled={status !== 'ready'} className={`${ACTION_BASE_CLASS} border border-border bg-card hover:bg-accent`}>
          <Printer className="h-4 w-4" aria-hidden="true" />
          Cetak
        </button>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => goToPage(currentPage - 2)}
            disabled={!hasPages || atFirst}
            aria-label="Halaman sebelumnya"
            className={TOOL_BUTTON_CLASS}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="min-w-[70px] text-center text-[11px] font-medium tabular-nums text-muted-foreground">
            {hasPages ? `${currentPage} / ${pageCount}` : '– / –'}
          </span>
          <button
            type="button"
            onClick={() => goToPage(currentPage)}
            disabled={!hasPages || atLast}
            aria-label="Halaman berikutnya"
            className={TOOL_BUTTON_CLASS}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="mx-0.5 h-5 w-px bg-border" aria-hidden="true" />
          <button
            type="button"
            onClick={() => setZoom((previous) => clampZoom(previous - 0.2))}
            disabled={!hasPages || zoom <= 0.6}
            aria-label="Perkecil"
            className={TOOL_BUTTON_CLASS}
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="w-9 text-center text-[11px] font-medium tabular-nums text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((previous) => clampZoom(previous + 0.2))}
            disabled={!hasPages || zoom >= 3}
            aria-label="Perbesar"
            className={TOOL_BUTTON_CLASS}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            disabled={!hasPages || zoom === 1}
            aria-label="Sesuaikan lebar"
            title="Sesuaikan lebar"
            className={TOOL_BUTTON_CLASS}
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="relative min-h-0 flex-1 overflow-auto overscroll-contain p-2 sm:p-3"
      >
        <div
          ref={containerRef}
          className="pdf-print-root mx-auto flex w-full flex-col items-center"
          style={{ maxWidth: MAX_PAGE_WIDTH + 2 }}
        />
        {/* Placeholder menjaga tinggi scroller agar layout tidak melompat. */}
        {status === 'loading' && !hasPages ? (
          <div className="mx-auto w-full" style={{ aspectRatio: `1 / ${aspect}`, maxWidth: MAX_PAGE_WIDTH }} />
        ) : null}

        {status === 'loading' ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-stone-100/90">
            <LifelineLoader label={hasPages ? 'Merender halaman…' : 'Menyiapkan dokumen…'} />
          </div>
        ) : null}

        {status === 'error' ? (
          <div
            role="alert"
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-stone-100 px-6 text-center"
          >
            <TriangleAlert className="h-6 w-6 text-amber-600" aria-hidden="true" />
            <p className="text-sm font-semibold text-stone-800">Dokumen tidak dapat ditampilkan</p>
            <p className="max-w-sm text-xs text-stone-500">
              Gunakan tombol <strong>Unduh PDF</strong> untuk membuka berkas di aplikasi pembaca PDF.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-2 inline-flex h-9 cursor-pointer items-center rounded-full border border-border bg-card px-4 text-xs font-semibold text-foreground hover:bg-accent"
            >
              Muat ulang halaman
            </button>
          </div>
        ) : null}

        <span className="sr-only" aria-live="polite">
          {hasPages ? `Halaman ${currentPage} dari ${pageCount}` : ''}
        </span>
      </div>
    </div>
  );
}
