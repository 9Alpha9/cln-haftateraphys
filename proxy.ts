import { NextRequest, NextResponse } from 'next/server';
import { buildContentSecurityPolicy } from '@/lib/security/csp';
import { shouldHideDashboardOnHost } from '@/lib/security/host-routing';
import {
  buildAuthRateLimitKey,
  consumeRateLimit,
  getAuthRateLimitPolicy,
  pruneRateLimitHits,
} from '@/lib/security/rate-limit';
import {
  decideMaintenance,
  getMaintenanceFlags,
  isMaintenanceExemptPath,
} from '@/lib/maintenance';

/**
 * Rate limit endpoint auth dengan penghitung di database, sehingga berlaku
 * lintas instance (bukan in-memory per proses).
 */
async function checkRateLimit(request: NextRequest, pathname: string): Promise<NextResponse | null> {
  const policy = getAuthRateLimitPolicy(pathname);
  if (!policy) return null;

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  try {
    const result = await consumeRateLimit(buildAuthRateLimitKey(ip, pathname), policy);
    if (!result.allowed) {
      return new NextResponse(
        JSON.stringify({
          error: 'Terlalu banyak percobaan. Silakan coba lagi nanti.',
          code: 'RATE_LIMIT_EXCEEDED',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(result.retryAfterSeconds),
          },
        }
      );
    }
    // Bersihkan baris lama sesekali (murah, tidak setiap request).
    if (Math.random() < 0.02) {
      void pruneRateLimitHits().catch(() => undefined);
    }
  } catch {
    // Fail-open: gangguan database tidak boleh mengunci semua pengguna dari login.
  }
  return null;
}

/**
 * Menyusun CSP per-request dengan nonce.
 *
 * - `script-src` memakai nonce + `strict-dynamic`; Next.js menempelkan nonce ke
 *   seluruh script framework/page secara otomatis karena header CSP dikirim pada
 *   request.
 * - `style-src` sengaja masih memuat 'unsafe-inline': framer-motion dan banyak
 *   komponen memakai style inline, dan nonce tidak berlaku untuk atribut style.
 *   Ini dicatat sebagai pengecualian yang disengaja (bukan kelalaian).
 */
function withNonceCsp(response: NextResponse, nonce: string): NextResponse {
  response.headers.set(
    'Content-Security-Policy',
    buildContentSecurityPolicy(nonce, process.env.NODE_ENV === 'development'),
  );
  return response;
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const host = request.headers.get('host') ?? '';
  const pathname = request.nextUrl.pathname;

  // Rate limiting check (backing store database)
  const rateLimitResponse = await checkRateLimit(request, pathname);
  if (rateLimitResponse) return rateLimitResponse;

  const publicHost = process.env.PUBLIC_APP_HOST ?? '';

  if (shouldHideDashboardOnHost(host, pathname, publicHost)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const flags = await getMaintenanceFlags();
  const decision = decideMaintenance({ flags });

  if (decision.mode === 'maintenance' && !isMaintenanceExemptPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/maintenance';
    url.search = '';
    const rewriteHeaders = new Headers(request.headers);
    rewriteHeaders.set('x-nonce', nonce);
    rewriteHeaders.set('Content-Security-Policy', `script-src 'nonce-${nonce}' 'strict-dynamic'`);
    return withNonceCsp(
      NextResponse.rewrite(url, { request: { headers: rewriteHeaders } }),
      nonce,
    );
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);
  requestHeaders.set('x-nonce', nonce);
  // Next.js membaca nonce dari header CSP pada request lalu menempelkannya ke
  // script framework/page saat SSR.
  requestHeaders.set(
    'Content-Security-Policy',
    `script-src 'nonce-${nonce}' 'strict-dynamic'`,
  );

  return withNonceCsp(NextResponse.next({ request: { headers: requestHeaders } }), nonce);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images).*)'],
};
