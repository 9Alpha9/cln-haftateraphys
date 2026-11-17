import { NextResponse } from 'next/server';
import { getRecentNotifications, getUnreadNotificationsCount } from '@/server/queries/notifications';
import { ForbiddenError, UnauthenticatedError } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [notifications, unreadCount] = await Promise.all([
      getRecentNotifications(8),
      getUnreadNotificationsCount(),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}