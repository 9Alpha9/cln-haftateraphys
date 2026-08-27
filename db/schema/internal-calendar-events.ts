import { index, integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './auth';

export const calendarEventTypeEnum = pgEnum('calendar_event_type', [
  'CLINIC_CLOSURE',
  'TRAINING',
  'INTERNAL_EVENT',
  'IMPORTANT_NOTICE',
]);

export const internalCalendarEvents = pgTable(
  'internal_calendar_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: text('title').notNull(),
    description: text('description'),
    eventType: calendarEventTypeEnum('event_type').notNull(),
    scheduledDate: timestamp('scheduled_date', { mode: 'string', withTimezone: false }).notNull(),
    startTime: text('start_time'),
    endTime: text('end_time'),
    patientVisible: integer('patient_visible').default(0).notNull(),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('internal_calendar_events_date_idx').on(table.scheduledDate)],
);
