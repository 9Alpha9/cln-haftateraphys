import { and, asc, eq, gte, isNull, lt } from 'drizzle-orm';
import { getDb } from '@/db';
import { internalCalendarEvents } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { ForbiddenError, hasPermission, PERMISSIONS } from '@/lib/permissions';

export type InternalCalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  eventType: string;
  scheduledDate: string;
  startTime: string | null;
  endTime: string | null;
  patientVisible: boolean;
};

export async function getInternalCalendarEvents(month: string): Promise<InternalCalendarEvent[]> {
  const { role } = await requireSession({ redirectToLogin: true });
  if (!hasPermission(role, PERMISSIONS.CALENDAR_EVENT_READ)) throw new ForbiddenError();
  const [year, monthNumber] = month.split('-').map(Number);
  if (!Number.isInteger(year) || !Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) return [];
  const start = `${month}-01T00:00:00`;
  const nextMonth = new Date(year, monthNumber, 1);
  const endExclusive = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01T00:00:00`;
  const filters = [
    isNull(internalCalendarEvents.archivedAt),
    gte(internalCalendarEvents.scheduledDate, start),
    lt(internalCalendarEvents.scheduledDate, endExclusive),
  ];
  if (role === 'USER') filters.push(eq(internalCalendarEvents.patientVisible, 1));
  try {
    const rows = await getDb()
      .select({
        id: internalCalendarEvents.id,
        title: internalCalendarEvents.title,
        description: internalCalendarEvents.description,
        eventType: internalCalendarEvents.eventType,
        scheduledDate: internalCalendarEvents.scheduledDate,
        startTime: internalCalendarEvents.startTime,
        endTime: internalCalendarEvents.endTime,
        patientVisible: internalCalendarEvents.patientVisible,
      })
      .from(internalCalendarEvents)
      .where(and(...filters))
      .orderBy(asc(internalCalendarEvents.scheduledDate), asc(internalCalendarEvents.startTime));
    return rows.map((event) => ({ ...event, patientVisible: event.patientVisible === 1 }));
  } catch {
    return [];
  }
}
