import { integer, pgEnum, pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './auth';
import { patients } from './patients';

export const homeProgramStatusEnum = pgEnum('home_program_status', ['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']);
export const homeProgramItemStatusEnum = pgEnum('home_program_item_status', ['ACTIVE', 'PAUSED', 'COMPLETED']);

export const homePrograms = pgTable(
  'home_programs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    treatmentPlanId: uuid('treatment_plan_id'),
    status: homeProgramStatusEnum('status').default('DRAFT').notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true }),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    patientVisible: integer('patient_visible').default(0).notNull(),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('home_programs_patient_id_idx').on(table.patientId)],
);

export const homeProgramItems = pgTable(
  'home_program_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    homeProgramId: uuid('home_program_id')
      .notNull()
      .references(() => homePrograms.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    instruction: text('instruction').notNull(),
    sets: integer('sets'),
    repetitions: integer('repetitions'),
    durationSeconds: integer('duration_seconds'),
    frequencyText: text('frequency_text'),
    precaution: text('precaution'),
    sortOrder: integer('sort_order').default(0).notNull(),
    status: homeProgramItemStatusEnum('status').default('ACTIVE').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('home_program_items_program_id_idx').on(table.homeProgramId)],
);

export const homeProgramsRelations = relations(homePrograms, ({ one, many }) => ({
  patient: one(patients, { fields: [homePrograms.patientId], references: [patients.id] }),
  createdByUser: one(users, { fields: [homePrograms.createdBy], references: [users.id] }),
  items: many(homeProgramItems),
}));

export const homeProgramItemsRelations = relations(homeProgramItems, ({ one }) => ({
  homeProgram: one(homePrograms, { fields: [homeProgramItems.homeProgramId], references: [homePrograms.id] }),
}));
