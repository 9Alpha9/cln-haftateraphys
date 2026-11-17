import { NextRequest, NextResponse } from 'next/server';
import { shouldHideDashboardOnHost } from '@/lib/security/host-routing';
import {
  decideMaintenance,
  getMaintenanceFlags,
  isMaintenanceExemptPath,
} from '@/lib/maintenance';

// In-memory rate limiter untuk endpoint auth sensitif
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const WINDOW_MS = 60 * 1000; // 1 menit
const MAX_AUTH_ATTEMPTS = 15; // Maksimal 15 percobaan/menit

function checkRateLimit(request: NextRequest, pathname: string): NextResponse | null {
  if (
    pathname.startsWith('/api/auth/sign-in') ||
    pathname.startsWith('/api/auth/sign-up') ||
    pathname.startsWith('/api/auth/request-password-reset')
  ) {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    const key = `${ip}:${pathname}`;
    const now = Date.now();
    let record = rateLimitMap.get(key);

    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + WINDOW_MS };
      rateLimitMap.set(key, record);
    } else {
      record.count++;
    }

    if (record.count > MAX_AUTH_ATTEMPTS) {
      return new NextResponse(
        JSON.stringify({
          error: 'Terlalu banyak percobaan. Silakan coba lagi nanti.',
          code: 'RATE_LIMIT_EXCEEDED',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
          },
        }
      );
    }
  }
  return null;
}

export async function proxy(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  const pathname = request.nextUrl.pathname;

  // Rate limiting check
  const rateLimitResponse = checkRateLimit(request, pathname);
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
    return NextResponse.rewrite(url);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images).*)'],
};
