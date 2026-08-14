import { getDb } from '@/db';
import { notifications } from '@/db/schema';

export type NotifyInput = {
  userId: string;
  title: string;
  message?: string | null;
  actionUrl?: string | null;
};

/**
 * Creates a notification row for a single recipient. Best-effort: never throws
 * so it cannot break the primary action it accompanies.
 */
export async function notifyUser({ userId, title, message, actionUrl }: NotifyInput) {
  try {
    await getDb().insert(notifications).values({
      userId,
      title,
      message: message?.trim() ? message.trim() : null,
      actionUrl: actionUrl?.trim() ? actionUrl.trim() : null,
    });
  } catch {
    // Notifications are best-effort; swallow failures.
  }
}
