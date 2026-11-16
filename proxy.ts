import { NextRequest, NextResponse } from 'next/server';
import { shouldHideDashboardOnHost } from '@/lib/security/host-routing';
import {
  decideMaintenance,
  getMaintenanceFlags,
  isMaintenanceExemptPath,
} from '@/lib/maintenance';

export async function proxy(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  const pathname = request.nextUrl.pathname;
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
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images).*)'],
};
