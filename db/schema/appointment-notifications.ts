import { index, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { appointments } from './appointments';
import { users } from './auth';

export const appointmentNotificationReads = pgTable(
  'appointment_notification_reads',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    appointmentId: uuid('appointment_id')
      .notNull()
      .references(() => appointments.id, { onDelete: 'restrict' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    readAt: timestamp('read_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('appointment_notification_reads_appointment_user_idx').on(table.appointmentId, table.userId),
    index('appointment_notification_reads_user_id_idx').on(table.userId),
  ],
);
