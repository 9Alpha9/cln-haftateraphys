import { index, integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { patients } from './patients';
import { users } from './auth';

export const therapyProgressStatusEnum = pgEnum('therapy_progress_status', ['DRAFT', 'FINALIZED']);

export const therapyProgressRecords = pgTable(
  'therapy_progress_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'restrict' }),
    therapistId: uuid('therapist_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
    painScore: integer('pain_score').notNull(),
    rangeOfMotionScore: integer('range_of_motion_score').notNull(),
    strengthScore: integer('strength_score').notNull(),
    functionScore: integer('function_score').notNull(),
    anamnesis: text('anamnesis'),
    physicalExamination: text('physical_examination'),
    diagnosis: text('diagnosis'),
    treatment: text('treatment'),
    followUpPlan: text('follow_up_plan'),
    summary: text('summary'),
    status: therapyProgressStatusEnum('status').default('DRAFT').notNull(),
    patientVisible: integer('patient_visible').default(0).notNull(),
    finalizedAt: timestamp('finalized_at', { withTimezone: true }),
    finalizedBy: uuid('finalized_by').references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('therapy_progress_records_patient_recorded_at_idx').on(table.patientId, table.recordedAt),
    index('therapy_progress_records_therapist_idx').on(table.therapistId),
  ],
);
