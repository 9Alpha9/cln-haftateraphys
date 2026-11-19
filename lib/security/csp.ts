/**
 * Penyusun header Content-Security-Policy per-request (nonce).
 *
 * Dipisah dari `proxy.ts` agar bisa diuji tanpa menjalankan middleware.
 *
 * Catatan keamanan:
 * - `script-src` memakai nonce + `strict-dynamic`; `unsafe-inline` tidak dipakai.
 * - `style-src` masih memuat `unsafe-inline` karena framer-motion dan banyak
 *   komponen memakai atribut `style` inline (nonce tidak berlaku untuk atribut).
 *   Ini pengecualian yang disengaja dan perlu kajian bila ingin diperketat.
 * - `unsafe-eval` hanya di development (React dev tooling membutuhkannya).
 */
export function buildContentSecurityPolicy(nonce: string, isDev: boolean): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://www.google.com${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    // `lh3.googleusercontent.com` = avatar ulasan Google di landing/kontak.
    "img-src 'self' data: blob: https://lh3.googleusercontent.com",
    "connect-src 'self' data: blob:",
    "font-src 'self' data:",
    "worker-src 'self' blob:",
    "frame-src 'self' blob: https://www.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    ...(isDev ? [] : ['upgrade-insecure-requests']),
  ].join('; ');
}
