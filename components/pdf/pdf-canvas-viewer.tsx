'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, Printer, TriangleAlert } from 'lucide-react';
import { LifelineLoader } from '@/components/animate-ui/lifeline-loader';

type ViewerStatus = 'loading' | 'ready' | 'error';

/**
 * Cache byte PDF per URL selama 20 detik.
 *
 * Dua manfaat: (1) React StrictMode di dev menjalankan effect dua kali sehingga
 * tanpa cache berkas diunduh dua kali; (2) membuka ulang pratinjau untuk rekam
 * yang sama tidak perlu mengunduh/menunggu render server lagi. TTL pendek
 * membuat suntingan rekam tetap terlihat cepat.
 */
const PDF_BYTES_TTL_MS = 20_000;
const pdfBytesCache = new Map<string, { promise: Promise<ArrayBuffer>; at: number }>();

function fetchPdfBytes(src: string): Promise<ArrayBuffer> {
  const cached = pdfBytesCache.get(src);
  if (cached && Date.now() - cached.at < PDF_BYTES_TTL_MS) return cached.promise;

  const promise = fetch(src, { credentials: 'same-origin' }).then(async (response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.arrayBuffer();
  });

  // Jangan simpan kegagalan agar percobaan berikutnya benar-benar mengulang.
  promise.catch(() => pdfBytesCache.delete(src));

  if (pdfBytesCache.size >= 3) {
    const oldest = pdfBytesCache.keys().next().value;
    if (oldest && oldest !== src) pdfBytesCache.delete(oldest);
  }
  pdfBytesCache.set(src, { promise, at: Date.now() });
  return promise;
}

/**
 * Penampil PDF berbasis canvas (pdf.js) yang tidak bergantung pada plugin PDF
 * bawaan browser.
 *
 * Latar belakang: iframe PDF hanya bekerja bila browser memiliki viewer PDF
 * internal. iOS Safari tidak punya toolbar (hanya merender isi), sementara
 * sebagian browser Android (Firefox, Samsung Internet) tidak merender PDF di
 * iframe sama sekali. Dengan pdf.js, halaman digambar ke <canvas> sehingga
 * tampil sama di semua browser, dan tombol Cetak/Unduh disediakan sendiri.
 *
 * Halaman dirender bertahap: halaman pertama langsung, sisanya saat mendekati
 * viewport (IntersectionObserver) agar dokumen terlihat lebih cepat.
 */
export function PdfCanvasViewer({
  src,
  fileName,
}: {
  src: string;
  fileName?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Status disimpan bersama `src` sumbernya agar pergantian dokumen otomatis
  // menampilkan loading lagi tanpa setState di awal effect.
  const [viewer, setViewer] = useState<{ src: string | null; status: ViewerStatus; pages: number }>(
    { src: null, status: 'loading', pages: 0 },
  );
  const status: ViewerStatus = viewer.src === src ? viewer.status : 'loading';
  const pageCount = viewer.src === src ? viewer.pages : 0;

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (container) container.replaceChildren();

    let observer: IntersectionObserver | null = null;
    const renderQueue: Array<() => Promise<void>> = [];
    let rendering = false;

    const pump = async () => {
      if (rendering) return;
      rendering = true;
      while (renderQueue.length > 0) {
        const job = renderQueue.shift();
        if (!job) break;
        await job();
      }
      rendering = false;
    };

    (async () => {
      try {
        // Muat modul pdf.js dan unduh berkas bersamaan: keduanya independen dan
        // masing-masing memakan ~1-2 detik pada kunjungan pertama.
        const pdfjsPromise = import('pdfjs-dist');
        const bytesPromise = fetchPdfBytes(src);

        const pdfjs = await pdfjsPromise;
        // Worker di-bundle oleh Next; `worker-src 'self' blob:` pada CSP
        // mengizinkannya.
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url,
        ).toString();

        // pdf.js memindahkan (transfer) buffer ke worker sehingga buffer asal
        // menjadi detached. Kirim salinan agar cache tetap bisa dipakai ulang.
        const data = new Uint8Array((await bytesPromise).slice(0));

        const pdfDocument = await pdfjs.getDocument({ data }).promise;
        if (cancelled || !container) return;

        const available = Math.max(280, container.clientWidth - 8);
        const ratio = Math.min(2, Math.max(1.5, window.devicePixelRatio || 1));

        // Dimensi halaman pertama dipakai sebagai rasio placeholder semua halaman
        // (umumnya seragam A4), sehingga tata letak tidak melompat saat render.
        const firstPage = await pdfDocument.getPage(1);
        const firstBase = firstPage.getViewport({ scale: 1 });
        const placeholderWidth = Math.floor(firstBase.width * (available / firstBase.width) * ratio);
        const placeholderHeight = Math.floor(firstBase.height * (available / firstBase.width) * ratio);

        observer = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (!entry.isIntersecting) continue;
              const target = entry.target as HTMLCanvasElement;
              observer?.unobserve(target);
              const pageNumber = Number(target.dataset.pageNumber ?? '0');
              if (!pageNumber) continue;
              renderQueue.push(async () => {
                if (cancelled) return;
                const page = await pdfDocument.getPage(pageNumber);
                const baseViewport = page.getViewport({ scale: 1 });
                const cssScale = available / baseViewport.width;
                const viewport = page.getViewport({ scale: cssScale * ratio });
                target.width = Math.floor(viewport.width);
                target.height = Math.floor(viewport.height);
                await page.render({ canvas: target, viewport }).promise;
                target.dataset.rendered = 'true';
                if (pageNumber === 1 && !cancelled) {
                  setViewer({ src, status: 'ready', pages: pdfDocument.numPages });
                }
              });
              void pump();
            }
          },
          { root: container, rootMargin: '400px 0px' },
        );

        for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
          if (cancelled) return;
          const canvas = document.createElement('canvas');
          canvas.width = placeholderWidth;
          canvas.height = placeholderHeight;
          canvas.dataset.pageNumber = String(pageNumber);
          canvas.style.width = '100%';
          canvas.style.height = 'auto';
          canvas.className =
            'mx-auto mb-3 block w-full max-w-full rounded-lg border border-border bg-white shadow-[0_1px_2px_rgba(28,25,23,0.06)]';
          container.appendChild(canvas);
          observer.observe(canvas);
        }

        // Halaman pertama dirender segera tanpa menunggu observer.
        const firstCanvas = container.querySelector<HTMLCanvasElement>('canvas[data-page-number="1"]');
        if (firstCanvas) {
          observer.unobserve(firstCanvas);
          renderQueue.push(async () => {
            if (cancelled) return;
            const baseViewport = firstPage.getViewport({ scale: 1 });
            const cssScale = available / baseViewport.width;
            const viewport = firstPage.getViewport({ scale: cssScale * ratio });
            firstCanvas.width = Math.floor(viewport.width);
            firstCanvas.height = Math.floor(viewport.height);
            await firstPage.render({ canvas: firstCanvas, viewport }).promise;
            firstCanvas.dataset.rendered = 'true';
            if (!cancelled) {
              setViewer({ src, status: 'ready', pages: pdfDocument.numPages });
            }
          });
          void pump();
        }
      } catch (error) {
        if (!cancelled) {
          setViewer({ src, status: 'error', pages: 0 });
          console.error(
            '[pdf-viewer] gagal merender dokumen',
            error instanceof Error ? error.message : 'unknown',
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [src]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-stone-100">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-background px-3 py-2">
        <a
          href={src}
          download={fileName}
          className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--hafta-300)] px-4 text-xs font-bold text-foreground transition-colors hover:bg-[var(--hafta-400)]"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Unduh PDF
        </a>
        <button
          type="button"
          onClick={() => window.print()}
          disabled={status !== 'ready'}
          className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full border border-border bg-card px-4 text-xs font-semibold text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Printer className="h-4 w-4" aria-hidden="true" />
          Cetak
        </button>
        {pageCount > 0 ? (
          <span className="ml-auto text-[11px] font-medium text-muted-foreground">
            {pageCount} halaman
          </span>
        ) : null}
      </div>

      <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 sm:p-3">
        <div ref={containerRef} className="pdf-print-root mx-auto w-full max-w-3xl" />

        {status === 'loading' ? (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-100/95">
            <LifelineLoader label="Menyiapkan dokumen…" />
          </div>
        ) : null}

        {status === 'error' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-stone-100 px-6 text-center">
            <TriangleAlert className="h-6 w-6 text-amber-600" aria-hidden="true" />
            <p className="text-sm font-semibold text-stone-800">Dokumen tidak dapat ditampilkan</p>
            <p className="max-w-sm text-xs text-stone-500">
              Gunakan tombol <strong>Unduh PDF</strong> untuk membuka berkas di aplikasi pembaca PDF.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
