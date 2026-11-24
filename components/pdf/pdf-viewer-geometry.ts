/**
 * Perhitungan ukuran halaman PDF pada penampil canvas.
 *
 * Dipisah dari komponen supaya bisa diuji tanpa DOM. Latar masalahnya: lebar
 * canvas ditentukan saat halaman dirender. Bila lebar wadah berubah setelahnya
 * (mis. modal dibuka saat layar masih lebar, lalu perangkat diputar atau
 * orientasi berubah), canvas akan meluber karena atribut bitmap-nya tetap.
 */

/** Perbesaran bitmap terhadap ukuran CSS-nya. */
export function pdfCanvasRatio(devicePixelRatio: number): number {
  // Batasi 1.5–2 agar teks tetap tajam tanpa bitmap raksasa di layar retina.
  return Math.min(2, Math.max(1.5, devicePixelRatio || 1));
}

/**
 * Lebar CSS dokumen di dalam wadah: penuh, tetapi tidak melebihi supaya halaman
 * tetap terbaca di desktop. Menghindari `Math.max(280, …)` karena pada layar
 * 360px nilai itu memaksa lebar 280px yang memicu scroll horizontal di wadah
 * yang sudah dipotong padding.
 */
export function fitToWidthCssWidth(containerClientWidth: number, padding = 8, maxWidth = 768): number {
  const available = containerClientWidth - padding;
  return Math.max(1, Math.min(available, maxWidth));
}

/** Ukuran bitmap canvas (atribut `width`/`height`) untuk satu halaman. */
export function pdfCanvasBitmapSize(
  viewport: { width: number; height: number },
  cssWidth: number,
  ratio: number,
): { width: number; height: number } {
  if (viewport.width <= 0 || cssWidth <= 0) return { width: 0, height: 0 };
  const scale = (cssWidth / viewport.width) * ratio;
  return {
    width: Math.max(1, Math.floor(viewport.width * scale)),
    height: Math.max(1, Math.floor(viewport.height * scale)),
  };
}

/**
 * Apakah canvas perlu dirender ulang: belum pernah dirender, atau lebar CSS
 * berubah cukup jauh (>2%) sehingga bitmap lama akan tampak buram/meluber.
 */
export function needsRerender(
  rendered: { cssWidth: number; zoom: number } | undefined,
  cssWidth: number,
  zoom: number,
): boolean {
  if (!rendered) return true;
  if (Math.abs(rendered.zoom - zoom) > 1e-6) return true;
  if (rendered.cssWidth <= 0) return true;
  return Math.abs(rendered.cssWidth - cssWidth) / rendered.cssWidth > 0.02;
}

/** Awal indeks halaman kontainer untuk ukuran halaman: halaman ke-1 adalah indeks 0. */
export function clampPageIndex(index: number, pageCount: number): number {
  if (!Number.isFinite(index) || pageCount <= 0) return 0;
  return Math.min(Math.max(0, Math.round(index)), pageCount - 1);
}

/** Batas zoom penampil: 60%–300% agar tetap terbaca dan tidak menghabiskan memori. */
export const PDF_ZOOM_MIN = 0.6;
export const PDF_ZOOM_MAX = 3;

export function clampZoom(zoom: number): number {
  if (!Number.isFinite(zoom)) return 1;
  return Math.min(PDF_ZOOM_MAX, Math.max(PDF_ZOOM_MIN, Math.round(zoom * 100) / 100));
}
