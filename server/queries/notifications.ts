import { and, count, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { notifications } from "@/db/schema";
import { requireSession } from "@/lib/auth/require-session";

export async function getUnreadNotificationsCount() {
  const { session } = await requireSession({ redirectToLogin: false });
  const [result] = await getDb()
    .select({ value: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, session.user.id), eq(notifications.isRead, false)));
  return result?.value ?? 0;
}

export async function getRecentNotifications(limit = 8) {
  const { session } = await requireSession({ redirectToLogin: false });
  return getDb()
    .select({
      id: notifications.id,
      title: notifications.title,
      message: notifications.message,
      actionUrl: notifications.actionUrl,
      isRead: notifications.isRead,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(eq(notifications.userId, session.user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getNotificationsPage(page = 1, pageSize = 20) {
  const { session } = await requireSession({ redirectToLogin: false });
  const db = getDb();
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(50, Math.max(1, pageSize));
  const offset = (safePage - 1) * safePageSize;

  const [countResult, items] = await Promise.all([
    db
      .select({ value: count() })
      .from(notifications)
      .where(eq(notifications.userId, session.user.id)),
    db
      .select({
        id: notifications.id,
        title: notifications.title,
        message: notifications.message,
        actionUrl: notifications.actionUrl,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(eq(notifications.userId, session.user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(safePageSize)
      .offset(offset),
  ]);

  const total = countResult?.[0]?.value ?? 0;
  return {
    items,
    total,
    totalPages: Math.max(1, Math.ceil(total / safePageSize)),
    page: safePage,
    pageSize: safePageSize,
  };
}
