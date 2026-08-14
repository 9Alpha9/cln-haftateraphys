"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { notifications } from "@/db/schema";
import { requireSession } from "@/lib/auth/require-session";

export async function markNotificationAsRead(notificationId: string) {
  const { session } = await requireSession({ redirectToLogin: false });
  await getDb()
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, session.user.id)));
  revalidatePath("/dashboard");
}

export async function markAllNotificationsAsRead() {
  const { session } = await requireSession({ redirectToLogin: false });
  await getDb()
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, session.user.id), eq(notifications.isRead, false)));
  revalidatePath("/dashboard");
}
