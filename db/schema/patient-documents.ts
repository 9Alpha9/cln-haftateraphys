import { index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './auth';
import { patients } from './patients';

export const documentTypeEnum = pgEnum('document_type', [
  'EXAM_RESULT',
  'REFERRAL',
  'INSURANCE',
  'MEDICAL_RECORD',
  'CONSENT',
  'OTHER',
]);

export const documentStatusEnum = pgEnum('document_status', ['ACTIVE', 'ARCHIVED']);

export const patientDocuments = pgTable(
  'patient_documents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    uploadedBy: uuid('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
    storageKey: text('storage_key').notNull(),
    originalFilename: text('original_filename'),
    mimeType: text('mime_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    documentType: documentTypeEnum('document_type').default('OTHER').notNull(),
    checksum: text('checksum'),
    patientVisible: integer('patient_visible').default(0).notNull(),
    status: documentStatusEnum('status').default('ACTIVE').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('patient_documents_patient_id_idx').on(table.patientId),
    index('patient_documents_status_idx').on(table.status),
    uniqueIndex('patient_documents_storage_key_idx').on(table.storageKey),
  ],
);

export const patientDocumentsRelations = relations(patientDocuments, ({ one }) => ({
  patient: one(patients, { fields: [patientDocuments.patientId], references: [patients.id] }),
  uploadedByUser: one(users, { fields: [patientDocuments.uploadedBy], references: [users.id] }),
}));
