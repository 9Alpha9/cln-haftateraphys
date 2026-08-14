import { NextRequest, NextResponse } from 'next/server';
import { shouldHideDashboardOnHost } from '@/lib/security/host-routing';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  const pathname = request.nextUrl.pathname;
  const publicHost = process.env.PUBLIC_APP_HOST ?? '';

  if (shouldHideDashboardOnHost(host, pathname, publicHost)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images).*)'],
};
