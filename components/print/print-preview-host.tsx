'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { PRINT_PREVIEW_EVENT } from '@/components/print/print-iframe';

/**
 * Visible print preview overlay.
 *
 * The previewed page owns its Cetak/Unduh controls (the browser PDF viewer for
 * medical-record PDFs, or the in-page print trigger for appointment sheets),
 * so this host only frames the document and offers a close action.
 */
export function PrintPreviewHost() {
  const [url, setUrl] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const handlePreview = (event: Event) => {
      const detail = (event as CustomEvent<{ url?: string }>).detail;
      if (detail?.url) setUrl(detail.url);
    };
    window.addEventListener(PRINT_PREVIEW_EVENT, handlePreview);
    return () => window.removeEventListener(PRINT_PREVIEW_EVENT, handlePreview);
  }, []);

  // Escape closes; focus lands on the close action so the overlay is operable
  // from the keyboard (the iframe content is a separate document).
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
              Cetak atau simpan dokumen lewat kontrol di dalam pratinjau.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => setUrl(null)}
            aria-label="Tutup pratinjau cetak"
            className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <iframe
          src={url}
          title="Pratinjau cetak"
          allow="fullscreen"
          className="min-h-0 w-full flex-1 border-0 bg-white"
        />
      </div>
    </div>
  );
}
