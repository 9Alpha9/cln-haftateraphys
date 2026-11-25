'use client';

import { useCallback, useEffect, useState } from 'react';
import { LifelineLoader } from '@/components/animate-ui/lifeline-loader';

/** Lokasi aset resmi PDF.js Generic Viewer yang disajikan dari origin aplikasi. */
const GENERIC_VIEWER_URL = '/pdfjs/web/viewer.html';

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
 * Dokumen dimuat melalui parameter standar PDF.js `?file=<url>` pada
 * `viewer.html` — tidak ada jembatan `postMessage` karena `PDFViewerApplication`
 * diekspor sebagai modul ES (tidak tersedia pada objek `window`). Nama berkas
 * unduhan diambil dari header `Content-Disposition` endpoint PDF.
 */
export function HaftaPdfjsViewer({
  src,
  title,
}: {
  /** Endpoint PDF same-origin yang sudah terproteksi sesi/otorisasi. */
  src: string;
  /** Judul dokumen (dipakai untuk label aksesibilitas iframe). */
  title?: string;
}) {
  const [loaded, setLoaded] = useState(false);

  const viewerSrc = `${GENERIC_VIEWER_URL}?file=${encodeURIComponent(src)}`;

  const handleLoad = useCallback(() => setLoaded(true), []);

  // Timer pengaman agar loader tidak tertahan terus apabila onLoad iframe
  // tertunda atau ter-reset oleh PDF.js worker.
  useEffect(() => {
    const timer = window.setTimeout(() => setLoaded(true), 1500);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-stone-200">
      <iframe
        src={viewerSrc}
        title={title ?? 'Penampil PDF rekam medis'}
        className="h-full min-h-0 w-full flex-1 border-0 bg-white"
        // `downloads` menjaga tombol unduh PDF.js tetap diizinkan bila browser
        // memberlakukan Permissions-Policy pada konten iframe.
        allow="fullscreen downloads"
        onLoad={handleLoad}
      />

      {!loaded ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-stone-100/95">
          <LifelineLoader label="Menyiapkan dokumen…" />
        </div>
      ) : null}
    </div>
  );
}
