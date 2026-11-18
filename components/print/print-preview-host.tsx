'use client';

import { useEffect, useRef, useState } from 'react';

const PRINT_PREVIEW_EVENT = 'hafta:print-preview';

/** Opens a print route inside a visible iframe preview instead of a new tab. */
export function openPrintPreview(url: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PRINT_PREVIEW_EVENT, { detail: { url } }));
}

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

  if (!url) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pratinjau cetak"
      className="fixed inset-0 z-[80] bg-black/80 transition-opacity duration-200 ease-out data-[starting-style]:opacity-0 data-[ending-style]:opacity-0"
    >
      <div className="fixed left-[50%] top-[50%] z-[80] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-3.5 sm:p-5 transition-[opacity,scale] duration-200 ease-out data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 sm:rounded-lg">
        <p className="text-sm font-bold text-foreground">Pratinjau Cetak</p>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setUrl(null)}
            aria-label="Tutup pratinjau cetak"
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 bg-white">
          <iframe
            ref={iframeRef}
            src={url}
            title="Pratinjau cetak"
            className="h-full w-full border-0"
          />
        </div>
      </div>
    </div>
  );
}