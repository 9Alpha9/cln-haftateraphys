'use client';

const PRINT_IFRAME_ID = 'hafta-print-frame';

/**
 * Loads a print route into a hidden, off-screen iframe and lets the target
 * page trigger its own `window.print()` (same approach as the medical-record
 * PDF print). Avoids opening a new browser tab.
 */
export function printUrlViaIframe(url: string) {
  if (typeof document === 'undefined') return;

  let iframe = document.getElementById(PRINT_IFRAME_ID) as HTMLIFrameElement | null;

  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = PRINT_IFRAME_ID;
    iframe.title = 'Print frame';
    iframe.setAttribute('aria-hidden', 'true');
    iframe.setAttribute('tabindex', '-1');
    iframe.style.position = 'fixed';
    iframe.style.top = '0';
    iframe.style.left = '-9999px';
    iframe.style.width = '1024px';
    iframe.style.height = '768px';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
  }

  // Force a reload on every request so the print page re-runs its auto-print.
  const separator = url.includes('?') ? '&' : '?';
  iframe.src = `${url}${separator}t=${Date.now()}`;
}
