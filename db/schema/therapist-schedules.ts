import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './auth';

export const therapistSchedules = pgTable(
  'therapist_schedules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    therapistId: uuid('therapist_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    dayOfWeek: integer('day_of_week').notNull(),
    startTime: text('start_time').notNull(),
    endTime: text('end_time').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('therapist_schedules_therapist_id_idx').on(table.therapistId),
    uniqueIndex('therapist_schedules_slot_unique_idx').on(
      table.therapistId,
      table.dayOfWeek,
      table.startTime,
      table.endTime,
    ),
  ],
);

export const therapistTimeOff = pgTable(
  'therapist_time_off',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    therapistId: uuid('therapist_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    startDate: date('start_date', { mode: 'string' }).notNull(),
    endDate: date('end_date', { mode: 'string' }).notNull(),
    reason: text('reason'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('therapist_time_off_therapist_id_idx').on(table.therapistId),
    index('therapist_time_off_date_idx').on(table.startDate, table.endDate),
  ],
);

export const therapistSchedulesRelations = relations(therapistSchedules, ({ one }) => ({
  therapist: one(users, {
    fields: [therapistSchedules.therapistId],
    references: [users.id],
  }),
}));

export const therapistTimeOffRelations = relations(therapistTimeOff, ({ one }) => ({
  therapist: one(users, {
    fields: [therapistTimeOff.therapistId],
    references: [users.id],
  }),
  createdByUser: one(users, {
    fields: [therapistTimeOff.createdBy],
    references: [users.id],
  }),
}));
