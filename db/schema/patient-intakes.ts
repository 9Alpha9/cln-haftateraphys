import { index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './auth';
import { patients } from './patients';

export const intakeStatusEnum = pgEnum('intake_status', [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'NEEDS_REVISION',
  'ACCEPTED',
  'ARCHIVED',
]);

export const patientIntakes = pgTable(
  'patient_intakes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'restrict' }),
    version: integer('version').default(1).notNull(),
    status: intakeStatusEnum('status').default('DRAFT').notNull(),
    chiefComplaint: text('chief_complaint'),
    affectedArea: text('affected_area'),
    onsetDescription: text('onset_description'),
    triggeringEvent: text('triggering_event'),
    aggravatingFactors: text('aggravating_factors'),
    relievingFactors: text('relieving_factors'),
    dailyLimitations: text('daily_limitations'),
    previousInjuryHistory: text('previous_injury_history'),
    surgeryHistory: text('surgery_history'),
    relevantMedicalHistory: text('relevant_medical_history'),
    currentMedication: text('current_medication'),
    allergies: text('allergies'),
    patientGoal: text('patient_goal'),
    dataAccuracyAcknowledged: integer('data_accuracy_acknowledged').default(0).notNull(),
    reviewMessage: text('review_message'),
    reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'restrict' }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('patient_intakes_patient_version_idx').on(table.patientId, table.version),
    index('patient_intakes_patient_id_idx').on(table.patientId),
  ],
);

export const patientIntakesRelations = relations(patientIntakes, ({ one }) => ({
  patient: one(patients, { fields: [patientIntakes.patientId], references: [patients.id] }),
}));
