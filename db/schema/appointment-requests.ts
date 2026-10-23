import { pgEnum, pgTable, text, timestamp, integer, uuid, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './auth';
import { patients } from './patients';
import { appointments, appointmentTypeEnum } from './appointments';

export const appointmentRequestStatusEnum = pgEnum('appointment_request_status', [
  'PENDING',
  'APPROVED',
  'DECLINED',
  'CANCELLED',
]);

export const appointmentRequests = pgTable(
  'appointment_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    therapistId: uuid('therapist_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    requestedDate: timestamp('requested_date', { mode: 'string', withTimezone: false }).notNull(),
    startTime: text('start_time').notNull(),
    durationMinutes: integer('duration_minutes').default(60).notNull(),
    type: appointmentTypeEnum('type').default('THERAPY_SESSION').notNull(),
    status: appointmentRequestStatusEnum('status').default('PENDING').notNull(),
    patientNote: text('patient_note'),
    reviewNote: text('review_note'),
    rescheduleAppointmentId: uuid('reschedule_appointment_id').references(() => appointments.id, {
      onDelete: 'set null',
    }),
    appointmentId: uuid('appointment_id').references(() => appointments.id, { onDelete: 'set null' }),
    reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('appointment_requests_patient_id_idx').on(table.patientId),
    index('appointment_requests_status_idx').on(table.status),
    index('appointment_requests_requested_date_idx').on(table.requestedDate),
  ],
);

export const appointmentRequestsRelations = relations(appointmentRequests, ({ one }) => ({
  patient: one(patients, { fields: [appointmentRequests.patientId], references: [patients.id] }),
  therapist: one(users, { fields: [appointmentRequests.therapistId], references: [users.id] }),
  appointment: one(appointments, {
    fields: [appointmentRequests.appointmentId],
    references: [appointments.id],
  }),
  rescheduleAppointment: one(appointments, {
    fields: [appointmentRequests.rescheduleAppointmentId],
    references: [appointments.id],
  }),
}));
