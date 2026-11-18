import { index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './auth';
import { patients } from './patients';
import { therapyProgressRecords } from './therapy-progress';

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
    /**
     * Rekam medis yang memiliki lampiran ini. Diisi saat foto diunggah dari form
     * rekam medis, sehingga lampiran PDF mengikuti rekam yang bersangkutan dan
     * tidak bocor ke rekam lain milik pasien yang sama.
     */
    therapyProgressRecordId: uuid('therapy_progress_record_id').references(
      () => therapyProgressRecords.id,
      { onDelete: 'set null' },
    ),
    checksum: text('checksum'),
    patientVisible: integer('patient_visible').default(0).notNull(),
    status: documentStatusEnum('status').default('ACTIVE').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('patient_documents_patient_id_idx').on(table.patientId),
    index('patient_documents_status_idx').on(table.status),
    index('patient_documents_therapy_progress_record_idx').on(table.therapyProgressRecordId),
    uniqueIndex('patient_documents_storage_key_idx').on(table.storageKey),
  ],
);

export const patientDocumentsRelations = relations(patientDocuments, ({ one }) => ({
  patient: one(patients, { fields: [patientDocuments.patientId], references: [patients.id] }),
  uploadedByUser: one(users, { fields: [patientDocuments.uploadedBy], references: [users.id] }),
  therapyProgressRecord: one(therapyProgressRecords, {
    fields: [patientDocuments.therapyProgressRecordId],
    references: [therapyProgressRecords.id],
  }),
}));
