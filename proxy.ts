import { NextRequest, NextResponse } from 'next/server';
import { shouldHideDashboardOnHost } from '@/lib/security/host-routing';
import { decideMaintenance, maintenanceFlagsFromEnv } from '@/lib/maintenance';

export function proxy(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  const pathname = request.nextUrl.pathname;
  const publicHost = process.env.PUBLIC_APP_HOST ?? '';

  if (shouldHideDashboardOnHost(host, pathname, publicHost)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const maintenance = decideMaintenance({
    pathname,
    flags: maintenanceFlagsFromEnv(process.env),
  });

  if (maintenance.mode === 'rewrite') {
    const url = request.nextUrl.clone();
    url.pathname = '/maintenance';
    const response = NextResponse.rewrite(url);
    // Informasi tambahan untuk halaman maintenance (tanpa data klinis).
    response.headers.set('x-maintenance-title', encodeURIComponent(maintenance.flags.title));
    return response;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images).*)'],
};
