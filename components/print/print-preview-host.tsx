'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import {
  PRINT_PREVIEW_CLOSE_EVENT,
  PRINT_PREVIEW_EVENT,
} from '@/components/print/print-iframe';

/**
 * Visible print preview overlay.
 *
 * The previewed page owns its Cetak/Unduh controls (the in-page print trigger
 * for appointment sheets), so this host only frames the document and offers a
 * close action. The previewed page can also close the overlay itself through
 * `closePrintPreview()` after it finishes printing.
 */
export function PrintPreviewHost() {
  const [url, setUrl] = useState<string | null>(null);
  /**
   * Muat ulang state pratinjau bila tombol cetak diklik dua kali untuk dokumen
   * yang sama. Tanpa ini, URL identik tidak memicu iframe memuat ulang setelah
   * dokumen sebelumnya gagal dirender.
   */
  const [reloadToken, setReloadToken] = useState(0);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const handlePreview = (event: Event) => {
      const detail = (event as CustomEvent<{ url?: string }>).detail;
      if (detail?.url) {
        setUrl(detail.url);
        setReloadToken((token) => token + 1);
      }
    };
    const handleClose = () => setUrl(null);

    window.addEventListener(PRINT_PREVIEW_EVENT, handlePreview);
    window.addEventListener(PRINT_PREVIEW_CLOSE_EVENT, handleClose);
    return () => {
      window.removeEventListener(PRINT_PREVIEW_EVENT, handlePreview);
      window.removeEventListener(PRINT_PREVIEW_CLOSE_EVENT, handleClose);
    };
  }, []);

  // Escape closes, and the close action takes focus so the overlay stays
  // operable from the keyboard (the iframe is a separate document).
  useEffect(() => {
    if (!url) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setUrl(null);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [url]);

  if (!url) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pratinjau cetak"
      className="fixed inset-0 z-[80] flex flex-col bg-black/60 p-0 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setUrl(null);
      }}
    >
      <div className="relative mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden border border-border bg-background sm:rounded-2xl sm:shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-border bg-background px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">Pratinjau Cetak</p>
            <p className="truncate text-[10.5px] text-muted-foreground">
              Cetak atau unduh lewat tombol di dalam pratinjau.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setUrl(null)}
              aria-label="Tutup pratinjau cetak"
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <iframe
          key={reloadToken}
          data-print-preview-frame
          src={url}
          title="Pratinjau cetak"
          allow="fullscreen"
          className="min-h-0 w-full flex-1 border-0 bg-white dark:bg-white"
        />
      </div>
    </div>
  );
}
