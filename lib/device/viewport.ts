/**
 * Helper deteksi viewport kecil / perangkat sentuh untuk komponen client.
 *
 * Dipakai untuk memilih strategi scroll lock: overlay di mobile/touch butuh
 * kunci berbasis `position: fixed` (iOS Safari tidak menghormati
 * `overflow: hidden` saat disentuh), sedangkan di desktop cukup `overflow`.
 */
export const MOBILE_BREAKPOINT_PX = 1024;

let cachedMobileViewport: { matches: boolean; expiresAt: number } | null = null;
const MOBILE_VIEWPORT_CACHE_MS = 500;

/**
 * True bila viewport < 1024px atau perangkat memakai pointer kasar (touch).
 * Hasil di-cache sebentar agar aman dipanggil berulang saat overlay dibuka.
 */
export function isMobileViewport(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;

  const now = Date.now();
  if (cachedMobileViewport && cachedMobileViewport.expiresAt > now) {
    return cachedMobileViewport.matches;
  }

  const matches =
    window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`).matches ||
    window.matchMedia('(pointer: coarse)').matches;

  cachedMobileViewport = { matches, expiresAt: now + MOBILE_VIEWPORT_CACHE_MS };
  return matches;
}
