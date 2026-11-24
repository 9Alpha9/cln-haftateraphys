import { describe, expect, it } from 'vitest';
import {
  clampPageIndex,
  clampZoom,
  fitToWidthCssWidth,
  needsRerender,
  pdfCanvasBitmapSize,
  pdfCanvasRatio,
} from '@/components/pdf/pdf-viewer-geometry';

describe('geometri penampil PDF', () => {
  it('membatasi rasio bitmap agar tajam tanpa memakan memori berlebih', () => {
    expect(pdfCanvasRatio(1)).toBe(1.5);
    expect(pdfCanvasRatio(2)).toBe(2);
    expect(pdfCanvasRatio(3)).toBe(2);
    expect(pdfCanvasRatio(0)).toBe(1.5);
  });

  it('menyesuaikan lebar dengan wadah tanpa meluber di layar kecil', () => {
    // layar 360px: lebar halaman mengikuti wadah, bukan minimal 280px
    expect(fitToWidthCssWidth(352)).toBe(344);
    expect(fitToWidthCssWidth(344)).toBe(336);
    // desktop: dibatasi lebar maksimum agar halaman tidak raksasa
    expect(fitToWidthCssWidth(1400, 8, 768)).toBe(768);
    // wadah sangat kecil tidak menghasilkan lebar negatif
    expect(fitToWidthCssWidth(4, 8)).toBe(1);
  });

  it('menghitung bitmap dari lebar CSS saat render, bukan lebar tetap', () => {
    const viewport = { width: 595, height: 842 };
    expect(pdfCanvasBitmapSize(viewport, 300, 2)).toEqual({ width: 600, height: 849 });
    expect(pdfCanvasBitmapSize(viewport, 600, 2)).toEqual({ width: 1200, height: 1698 });
    expect(pdfCanvasBitmapSize({ width: 0, height: 0 }, 300, 2)).toEqual({ width: 0, height: 0 });
    expect(pdfCanvasBitmapSize(viewport, 0, 2)).toEqual({ width: 0, height: 0 });
  });

  it('menandai canvas perlu render ulang ketika lebar berubah signifikan', () => {
    expect(needsRerender(undefined, 400, 1)).toBe(true);
    expect(needsRerender({ cssWidth: 400, zoom: 1 }, 400, 1)).toBe(false);
    // selisih < 2% (mis. scrollbar muncul) → tidak perlu render ulang
    expect(needsRerender({ cssWidth: 400, zoom: 1 }, 405, 1)).toBe(false);
    // rotasi layar / modal dibuka dengan lebar lain → perlu
    expect(needsRerender({ cssWidth: 400, zoom: 1 }, 700, 1)).toBe(true);
    // zoom berubah walau lebar kebetulan sama
    expect(needsRerender({ cssWidth: 400, zoom: 1 }, 400, 2)).toBe(true);
    expect(needsRerender({ cssWidth: 0, zoom: 1 }, 400, 1)).toBe(true);
  });

  it('membatasi indeks halaman ke rentang dokumen', () => {
    expect(clampPageIndex(-5, 5)).toBe(0);
    expect(clampPageIndex(0, 5)).toBe(0);
    expect(clampPageIndex(2.4, 5)).toBe(2);
    expect(clampPageIndex(9, 5)).toBe(4);
    expect(clampPageIndex(Number.NaN, 5)).toBe(0);
    expect(clampPageIndex(3, 0)).toBe(0);
  });

  it('membatasi zoom ke 60%–300%', () => {
    expect(clampZoom(0.1)).toBe(0.6);
    expect(clampZoom(1.234)).toBe(1.23);
    expect(clampZoom(5)).toBe(3);
    expect(clampZoom(Number.NaN)).toBe(1);
  });
});
