import { NextResponse } from "next/server";
import { getRecentNotifications, getUnreadNotificationsCount } from "@/server/queries/notifications";

export async function GET() {
  try {
    const [notifications, unreadCount] = await Promise.all([
      getRecentNotifications(8),
      getUnreadNotificationsCount(),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch {
    return NextResponse.json({ notifications: [], unreadCount: 0 }, { status: 500 });
  }
}
