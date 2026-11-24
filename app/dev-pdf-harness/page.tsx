'use client';

import { useEffect, useRef, useState } from 'react';

type Probe = { label: string; detail: string };

/**
 * Harness uji sementara untuk menyelidiki komponen HaftaPdfjsViewer.
 * Hapus setelah verifikasi manual selesai.
 */
export default function PdfViewerHarnessPage() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [probes, setProbes] = useState<Probe[]>([]);

  useEffect(() => {
    const origin = window.location.origin;
    const host = hostRef.current;
    if (!host) return;

    const results: Probe[] = [];
    const push = (label: string, detail: string) => {
      const existing = results.find((item) => item.label === label);
      if (existing) existing.detail = `${existing.detail} | ${detail}`;
      else results.push({ label, detail });
      setProbes(results.map((item) => ({ ...item })));
    };

    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; label?: string; detail?: string } | null;
      if (!data || typeof data !== 'object' || !data.label) return;
      push(data.label, `${data.type ?? ''} ${data.detail ?? ''} origin=${event.origin}`);
    };
    window.addEventListener('message', onMessage);

    // Variasi: origin biasa (adaptasi /pdfjs/web/viewer.html) + blob adapter.
    const variations: Array<{ label: string; url: string; srcdoc?: string; sandbox?: string }> = [
      { label: 'same-origin', url: `${origin}/pdfjs/web/viewer.html?probe=1` },
      {
        label: 'blob-rewrite',
        url: `blob:${origin}/`,
        sandbox: 'allow-scripts allow-same-origin allow-downloads allow-modals allow-popups',
      },
    ];

    for (const variation of variations) {
      const frame = document.createElement('iframe');
      frame.title = variation.label;
      frame.style.cssText = 'width:600px;height:500px;border:1px solid #444';
      if (variation.sandbox) frame.setAttribute('sandbox', variation.sandbox);
      frame.addEventListener('load', () => {
        push(variation.label, 'loaded');
        frame.contentWindow?.postMessage({ type: 'hafta-pdf-viewer:ping', label: variation.label }, '*');
      });
      if (variation.srcdoc) frame.srcdoc = variation.srcdoc;
      else frame.src = variation.url;
      host.appendChild(frame);
    }

    return () => {
      window.removeEventListener('message', onMessage);
      host.innerHTML = '';
    };
  }, []);

  return (
    <main className="p-4">
      <h1 className="mb-2 text-lg font-semibold">Probe PDF viewer (sementara)</h1>
      <ul className="mb-4 space-y-1 text-xs">
        {probes.map((probe) => (
          <li key={probe.label}>
            <strong>{probe.label}</strong>: {probe.detail}
          </li>
        ))}
      </ul>
      <div ref={hostRef} className="flex flex-wrap gap-3" />
    </main>
  );
}
