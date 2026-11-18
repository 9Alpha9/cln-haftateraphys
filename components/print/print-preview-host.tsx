'use client';

import { useEffect, useRef, useState } from 'react';
import { Printer, X } from 'lucide-react';

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

  function handlePrint() {
    const frame = iframeRef.current;
    if (!frame) return;
    try {
      const innerDoc = frame.contentDocument;
      // The medical-record preview page has its own Cetak button to print the
      // PDF inside its nested frame; prefer clicking it when present.
      const innerButton = innerDoc
        ? Array.from(innerDoc.querySelectorAll('button')).find((button) =>
            /^Cetak$/i.test(button.textContent?.trim() ?? ''),
          )
        : null;
      if (innerButton) {
        innerButton.click();
        return;
      }
      frame.contentWindow?.print();
    } catch {
      frame.contentWindow?.print();
    }
  }

  if (!url) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pratinjau cetak"
      className="fixed inset-0 z-[120] flex flex-col bg-black/50 p-3 backdrop-blur-sm sm:p-6"
    >
      <div className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
          <p className="text-sm font-bold text-foreground">Pratinjau Cetak</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-[var(--hafta-300)] px-3.5 text-xs font-bold text-foreground transition-colors hover:bg-[var(--hafta-400)]"
            >
              <Printer className="h-3.5 w-3.5" />
              Cetak
            </button>
            <button
              type="button"
              onClick={() => setUrl(null)}
              aria-label="Tutup pratinjau cetak"
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
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
