/**
 * Content-Security-Policy untuk PDF.js Generic Viewer (`/pdfjs/**`).
 *
 * Viewer resmi adalah dokumen terpisah yang dimuat dari origin aplikasi sendiri.
 * Ia membutuhkan izin yang berbeda dari halaman aplikasi:
 * - `script-src 'self'`: viewer.html memuat `viewer.mjs` dan `../build/pdf.mjs`
 *   sebagai module script, dan `hafta-bridge.js` sebagai script klasik. Tidak
 *   ada inline script, jadi nonce `strict-dynamic` (dipakai aplikasi utama)
 *   justru akan memblokir berkas-berkas ini.
 * - `'wasm-unsafe-eval'`: pdf.js mengompilasi modul WASM (color management,
 *   dekoder gambar JPX/JBIG2) dari `/pdfjs/web/wasm/`.
 * - `worker-src 'self' blob:`: worker pdf.js (`../build/pdf.worker.mjs`).
 * - `img-src`/`font-src`/`connect-src`: aset viewer + locale JSON (`fetch`).
 *
 * `frame-ancestors 'self'` tetap menjaga viewer hanya boleh dibingkai aplikasi
 * sendiri, dan `object-src 'none'` mematikan plugin.
 */
export const PDFJS_VIEWER_PATH_PREFIX = '/pdfjs/';

export function buildPdfViewerContentSecurityPolicy(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'wasm-unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' data: blob:",
    "worker-src 'self' blob:",
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
    "frame-ancestors 'self'",
    ...(process.env.NODE_ENV === 'development' ? [] : ['upgrade-insecure-requests']),
  ].join('; ');
}

export function isPdfViewerAssetPath(pathname: string): boolean {
  return pathname.startsWith(PDFJS_VIEWER_PATH_PREFIX);
}
