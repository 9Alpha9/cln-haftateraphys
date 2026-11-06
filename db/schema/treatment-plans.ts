import { index, integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { patients } from './patients';
import { users } from './auth';

export const treatmentPlanStatusEnum = pgEnum('treatment_plan_status', [
  'DRAFT',
  'ACTIVE',
  'COMPLETED',
  'ARCHIVED',
]);

export const treatmentPlans = pgTable(
  'treatment_plans',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'restrict' }),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    goals: text('goals').notNull(),
    interventions: text('interventions').notNull(),
    reviewIntervalText: text('review_interval_text'),
    reviewAt: timestamp('review_at', { withTimezone: true }),
    precautions: text('precautions'),
    status: treatmentPlanStatusEnum('status').default('DRAFT').notNull(),
    patientVisible: integer('patient_visible').default(0).notNull(),
    activatedAt: timestamp('activated_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('treatment_plans_patient_idx').on(table.patientId)],
);

export const treatmentPlansRelations = relations(treatmentPlans, ({ one }) => ({
  patient: one(patients, { fields: [treatmentPlans.patientId], references: [patients.id] }),
  createdByUser: one(users, { fields: [treatmentPlans.createdBy], references: [users.id] }),
}));
