import { index, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './auth';
import { patients } from './patients';

export const consentTypeEnum = pgEnum('consent_type', [
  'PRIVACY_DATA_PROCESSING',
  'CLINICAL_SERVICE',
  'DOCUMENT_UPLOAD',
  'MEDIA_PUBLICATION',
  'TESTIMONIAL_PUBLICATION',
]);

export const consentStatusEnum = pgEnum('consent_status', [
  'PENDING',
  'GRANTED',
  'WITHDRAWN',
  'EXPIRED',
  'SUPERSEDED',
]);

export const consentSourceEnum = pgEnum('consent_source', [
  'INTAKE',
  'PATIENT_PORTAL',
  'STAFF',
]);

export const consents = pgTable(
  'consents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    type: consentTypeEnum('type').notNull(),
    policyVersion: text('policy_version').notNull(),
    status: consentStatusEnum('status').default('PENDING').notNull(),
    grantedAt: timestamp('granted_at', { withTimezone: true }),
    withdrawnAt: timestamp('withdrawn_at', { withTimezone: true }),
    source: consentSourceEnum('source').default('PATIENT_PORTAL').notNull(),
    capturedBy: uuid('captured_by').references(() => users.id, { onDelete: 'set null' }),
    /** Non-clinical metadata only; never store clinical details here. */
    metadataSafe: text('metadata_safe'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('consents_patient_id_idx').on(table.patientId),
    index('consents_patient_type_idx').on(table.patientId, table.type),
    uniqueIndex('consents_patient_type_version_idx').on(
      table.patientId,
      table.type,
      table.policyVersion,
    ),
  ],
);

export const consentsRelations = relations(consents, ({ one }) => ({
  patient: one(patients, { fields: [consents.patientId], references: [patients.id] }),
  capturedByUser: one(users, { fields: [consents.capturedBy], references: [users.id] }),
}));
