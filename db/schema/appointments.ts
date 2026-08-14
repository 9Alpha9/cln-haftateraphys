import { pgEnum, pgTable, text, timestamp, integer, uuid, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './auth';
import { patients } from './patients';

export const appointmentStatusEnum = pgEnum('appointment_status', [
  'SCHEDULED',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
  'RESCHEDULED',
  'NO_SHOW',
]);

export const appointmentTypeEnum = pgEnum('appointment_type', [
  'INITIAL_ASSESSMENT',
  'THERAPY_SESSION',
  'FOLLOW_UP',
  'EVALUATION',
]);

export const appointments = pgTable(
  'appointments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'restrict' }),
    therapistId: uuid('therapist_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    scheduledDate: timestamp('scheduled_date', { mode: 'string', withTimezone: false }).notNull(),
    startTime: text('start_time').notNull(),
    durationMinutes: integer('duration_minutes').default(60).notNull(),
    type: appointmentTypeEnum('type').default('THERAPY_SESSION').notNull(),
    status: appointmentStatusEnum('status').default('SCHEDULED').notNull(),
    administrativeNote: text('administrative_note'),
    cancellationReason: text('cancellation_reason'),
    rescheduledFromId: uuid('rescheduled_from_id'),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('appointments_patient_id_idx').on(table.patientId),
    index('appointments_therapist_id_idx').on(table.therapistId),
    index('appointments_scheduled_date_idx').on(table.scheduledDate),
  ],
);

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  patient: one(patients, {
    fields: [appointments.patientId],
    references: [patients.id],
  }),
  therapist: one(users, {
    fields: [appointments.therapistId],
    references: [users.id],
    relationName: 'therapistAppointments',
  }),
  createdByUser: one(users, {
    fields: [appointments.createdBy],
    references: [users.id],
    relationName: 'createdAppointments',
  }),
  rescheduledFrom: one(appointments, {
    fields: [appointments.rescheduledFromId],
    references: [appointments.id],
  }),
}));
