'use client';

const PRINT_PREVIEW_EVENT = 'hafta:print-preview';
const PRINT_PREVIEW_TAB_EVENT = 'hafta:print-preview-tab';
const PRINT_PREVIEW_CLOSE_EVENT = 'hafta:print-preview-close';

/**
 * Opens a print route inside a visible iframe preview instead of a new tab.
 *
 * The previewed page owns its Cetak/Unduh controls (the browser PDF viewer for
 * medical-record PDFs, or the in-page print trigger for appointment sheets),
 * so the host only frames the document and offers a close action.
 */
export function openPrintPreview(url: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PRINT_PREVIEW_EVENT, { detail: { url } }));
}

/**
 * Hands the previewed document to the host, which opens a same-origin print
 * route in a real tab. Blob URLs are downloaded instead, because a new tab
 * cannot reach another document's object URL.
 */
export function openPrintPreviewTab(url: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PRINT_PREVIEW_TAB_EVENT, { detail: { url } }));
}

/**
 * Menutup overlay pratinjau cetak. Dipakai halaman di dalam iframe setelah
 * pengguna selesai mencetak atau mengunduh dokumen.
 */
export function closePrintPreview() {
  if (typeof window === 'undefined') return;
  window.parent?.dispatchEvent(new CustomEvent(PRINT_PREVIEW_CLOSE_EVENT));
}

export { PRINT_PREVIEW_EVENT, PRINT_PREVIEW_TAB_EVENT, PRINT_PREVIEW_CLOSE_EVENT };
