/**
 * Cache byte PDF per URL selama beberapa detik.
 *
 * Dua manfaat: (1) React StrictMode di dev menjalankan effect dua kali sehingga
 * tanpa cache berkas diunduh dua kali; (2) membuka ulang pratinjau untuk rekam
 * yang sama tidak perlu menunggu render PDF di server lagi. TTL pendek supaya
 * suntingan rekam tetap terlihat cepat.
 *
 * Hanya byte berkas yang disimpan di memori tab, bukan data pasien di storage;
 * cache hilang saat tab ditutup dan tidak pernah ditulis ke localStorage.
 */
const PDF_BYTES_TTL_MS = 20_000;
const PDF_BYTES_MAX_ENTRIES = 3;
const pdfBytesCache = new Map<string, { promise: Promise<ArrayBuffer>; at: number }>();
const pdfWorkerUrlCache = new Map<string, Promise<string>>();

export function fetchPdfBytes(src: string): Promise<ArrayBuffer> {
  const cached = pdfBytesCache.get(src);
  if (cached && Date.now() - cached.at < PDF_BYTES_TTL_MS) return cached.promise;

  const promise = fetch(src, { credentials: 'same-origin' }).then(async (response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.arrayBuffer();
  });

  // Jangan simpan kegagalan agar percobaan berikutnya benar-benar mengulang.
  promise.catch(() => {
    if (pdfBytesCache.get(src)?.promise === promise) pdfBytesCache.delete(src);
  });

  if (pdfBytesCache.size >= PDF_BYTES_MAX_ENTRIES) {
    const oldest = pdfBytesCache.keys().next().value;
    if (oldest && oldest !== src) pdfBytesCache.delete(oldest);
  }
  pdfBytesCache.set(src, { promise, at: Date.now() });
  return promise;
}

/**
 * URL worker pdf.js yang bisa dipakai di semua browser.
 *
 * `legacyWorkerUrl` berasal dari bundler; bila `null` (mis. bundler tidak
 * mengemasnya di lingkungan tertentu), worker default pdf.js yang dipakai.
 *
 * Next menyalin `pdf.worker.min.mjs` ke `/_next/static/media/…`, tetapi berkas
 * hasil build tersebut masih memakai sintaks modern (mis. `Promise.withResolvers`)
 * yang belum ada di Safari lama sehingga worker gagal dimuat dan dokumen tidak
 * pernah tampil. Karena itu worker **dibekukan** oleh bundler (`?url` pada salinan
 * `pdfjs-dist/legacy/build`) tanpa ditransformasi, lalu dimuat sebagai blob —
 * diizinkan oleh `worker-src 'self' blob:` pada CSP.
 */
export function loadPdfWorkerUrl(legacyWorkerUrl: string | null): Promise<string | null> {
  if (!legacyWorkerUrl) return Promise.resolve(null);
  const cached = pdfWorkerUrlCache.get(legacyWorkerUrl);
  if (cached) return cached;

  const promise = (async () => {
    const response = await fetch(legacyWorkerUrl, { credentials: 'same-origin' });
    if (!response.ok) throw new Error(`worker HTTP ${response.status}`);
    const source = await response.text();
    return URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
  })();

  promise.catch(() => pdfWorkerUrlCache.delete(legacyWorkerUrl));
  pdfWorkerUrlCache.set(legacyWorkerUrl, promise);
  return promise;
}
