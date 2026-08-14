'use server';

import { and, eq, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/db';
import { internalCalendarEvents, notifications, profiles } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { ForbiddenError, hasPermission, PERMISSIONS } from '@/lib/permissions';
import { internalCalendarEventSchema, type InternalCalendarEventInput } from '@/lib/validators/internal-calendar-event';

function optionalValue(value: string | undefined) {
  return value?.trim() || null;
}

export async function createInternalCalendarEvent(input: InternalCalendarEventInput) {
  const data = internalCalendarEventSchema.parse(input);
  const { session, role } = await requireSession({ redirectToLogin: false });
  if (!hasPermission(role, PERMISSIONS.CALENDAR_EVENT_MANAGE)) throw new ForbiddenError();
  const db = getDb();
  
  await db.insert(internalCalendarEvents).values({
    title: data.title,
    description: optionalValue(data.description),
    eventType: data.eventType,
    scheduledDate: data.scheduledDate,
    startTime: optionalValue(data.startTime),
    endTime: optionalValue(data.endTime),
    patientVisible: data.patientVisible ? 1 : 0,
    createdBy: session.user.id,
  });

  if (data.eventType === 'IMPORTANT_NOTICE' && data.patientVisible) {
    const patientUsers = await db.select({ userId: profiles.userId }).from(profiles).where(eq(profiles.accountType, 'USER'));
    if (patientUsers.length > 0) {
      await db.insert(notifications).values(
        patientUsers.map((p) => ({
          userId: p.userId,
          title: 'Pengumuman Penting',
          message: data.title,
        }))
      );
    }
  }

  revalidatePath('/dashboard');
}

export async function archiveInternalCalendarEvent(id: string) {
  const { role } = await requireSession({ redirectToLogin: false });
  if (!hasPermission(role, PERMISSIONS.CALENDAR_EVENT_MANAGE)) throw new ForbiddenError();
  const result = await getDb()
    .update(internalCalendarEvents)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(internalCalendarEvents.id, id), isNull(internalCalendarEvents.archivedAt)))
    .returning({ id: internalCalendarEvents.id });
  if (result.length === 0) throw new Error('Event tidak ditemukan.');
  revalidatePath('/dashboard');
}
