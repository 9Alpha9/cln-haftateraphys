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
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const handlePreview = (event: Event) => {
      const detail = (event as CustomEvent<{ url?: string }>).detail;
      if (detail?.url) setUrl(detail.url);
    };
    window.addEventListener(PRINT_PREVIEW_EVENT, handlePreview);
    return () => window.removeEventListener(PRINT_PREVIEW_EVENT, handlePreview);
  }, []);

  useEffect(() => {
    if (!url) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setUrl(null);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [url]);

  // Clear the cached frame so each preview starts from a clean document.
  useEffect(() => {
    if (url) return;
    if (iframeRef.current) iframeRef.current.src = 'about:blank';
  }, [url]);

  if (!url) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pratinjau cetak"
      className="fixed inset-0 z-[80] flex flex-col bg-black/60 p-0 backdrop-blur-sm sm:p-6"
    >
      <div className="relative mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden border border-border bg-background sm:rounded-2xl sm:shadow-2xl">
        <button
          type="button"
          onClick={() => setUrl(null)}
          aria-label="Tutup pratinjau cetak"
          className="absolute right-2 top-2 z-10 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border bg-background/90 text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <iframe
          ref={iframeRef}
          src={url}
          title="Pratinjau cetak"
          className="h-full w-full border-0 bg-white"
        />
      </div>
    </div>
  );
}
