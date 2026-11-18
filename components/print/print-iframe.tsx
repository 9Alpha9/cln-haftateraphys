'use client';

const PRINT_PREVIEW_EVENT = 'hafta:print-preview';

/**
 * Opens a print route inside a visible iframe preview instead of a new tab.
 *
 * The previewed page keeps its own document content; the host only frames it
 * and offers a close action, so there is exactly one print surface (no hidden
 * iframe that would print a second copy on top of the overlay).
 */
export function openPrintPreview(url: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PRINT_PREVIEW_EVENT, { detail: { url } }));
}

export { PRINT_PREVIEW_EVENT };
