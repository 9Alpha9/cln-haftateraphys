'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { LifelineLoader } from '@/components/animate-ui/lifeline-loader';

/** Lokasi aset resmi PDF.js Generic Viewer yang disajikan dari origin aplikasi. */
const GENERIC_VIEWER_URL = '/pdfjs/web/viewer.html';

const READY = 'hafta-pdf-viewer:ready';
const OPEN = 'hafta-pdf-viewer:open';
const STATE = 'hafta-pdf-viewer:state';

type ViewerStatus = 'loading' | 'ready' | 'error';

/**
 * Penampil PDF memakai **PDF.js Generic Viewer** resmi (toolbar, navigasi
 * halaman, zoom, pencarian, sidebar, cetak, dan unduh semuanya milik viewer),
 * dibungkus iframe same-origin.
 *
 * Kenapa iframe: Generic Viewer adalah aplikasi web lengkap (viewer.html +
 * viewer.mjs + CSS + locale + cmaps + wasm). Merendernya sebagai komponen React
 * berarti menulis ulang toolbar-nya. Iframe menjaga seluruh perilaku resmi
 * (termasuk print service dan fitur mobile) apa adanya, dan tetap same-origin
 * sehingga cookie sesi ikut terkirim ke endpoint PDF.
 *
 * Dokumen dikirim lewat `postMessage` ke `hafta-bridge.js` di dalam viewer yang
 * memanggil `PDFViewerApplication.open()`; URL rekam medis tidak pernah masuk ke
 * address bar atau riwayat browser.
 */
export function HaftaPdfjsViewer({
  src,
  fileName,
  title,
}: {
  /** Endpoint PDF same-origin yang sudah terproteksi sesi/otorisasi. */
  src: string;
  fileName?: string;
  /** Judul dokumen (dipakai untuk label aksesibilitas iframe). */
  title?: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [bridgeReady, setBridgeReady] = useState(false);
  const [viewer, setViewer] = useState<{ src: string | null; status: ViewerStatus }>({
    src: null,
    status: 'loading',
  });

  const status: ViewerStatus = viewer.src === src ? viewer.status : 'loading';

  const postToViewer = useCallback((message: Record<string, unknown>) => {
    const frame = iframeRef.current;
    if (!frame?.contentWindow) return;
    // Target origin eksplisit (bukan '*') supaya pesan tidak bocor ke frame lain.
    frame.contentWindow.postMessage(message, window.location.origin);
  }, []);

  const openDocument = useCallback(() => {
    if (!src) return;
    postToViewer({ type: OPEN, url: src, fileName });
  }, [fileName, postToViewer, src]);

  // Terima sinyal dari jembatan viewer: siap menerima dokumen, atau hasil buka.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== iframeRef.current?.contentWindow) return;

      const data = event.data as { type?: string; state?: ViewerStatus } | null;
      if (!data || typeof data !== 'object') return;

      if (data.type === READY) {
        setBridgeReady(true);
        return;
      }
      if (data.type === STATE && (data.state === 'loading' || data.state === 'ready' || data.state === 'error')) {
        setViewer({ src, status: data.state });
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [src]);

  // Kirim dokumen setiap kali viewer siap atau dokumen berganti, sehingga tidak
  // pernah tampil dokumen pasien sebelumnya.
  useEffect(() => {
    if (!bridgeReady) return;
    openDocument();
    setViewer({ src, status: 'loading' });
  }, [bridgeReady, openDocument, src]);

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-stone-200">
      <iframe
        ref={iframeRef}
        src={GENERIC_VIEWER_URL}
        title={title ?? 'Penampil PDF rekam medis'}
        className="h-full min-h-0 w-full flex-1 border-0 bg-white"
        // `allow` dibatasi: viewer perlu unduh/cetak, bukan kamera/mikrofon.
        allow="fullscreen"
        onLoad={() => {
          // Jaring pengaman bila sinyal READY terlewat (mis. reload iframe):
          // minta jembatan mengumumkan ulang kesiapannya.
          postToViewer({ type: 'hafta-pdf-viewer:ping' });
        }}
      />

      {status === 'loading' ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-stone-100/95">
          <LifelineLoader label="Menyiapkan dokumen…" />
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
            Tutup pratinjau lalu buka kembali, atau unduh PDF lewat tombol di toolbar viewer.
          </p>
        </div>
      ) : null}
    </div>
  );
}
