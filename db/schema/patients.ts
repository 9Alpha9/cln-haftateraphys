import { pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './auth';

export const patientCaseStatusEnum = pgEnum('patient_case_status', [
  'INTAKE',
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
  'REFERRED',
  'ARCHIVED',
]);

export const assignmentTypeEnum = pgEnum('assignment_type', ['PRIMARY_THERAPIST', 'COVERAGE']);

export const patientGenderEnum = pgEnum('patient_gender', ['MALE', 'FEMALE', 'OTHER']);

export const patients = pgTable(
  'patients',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    fullName: text('full_name').notNull(),
    gender: patientGenderEnum('gender').default('MALE'),
    medicalRecordNumber: text('medical_record_number').unique(),
    dateOfBirth: timestamp('date_of_birth', { withTimezone: true }),
    occupation: text('occupation'),
    addressLine: text('address_line'),
    addressProvince: text('address_province'),
    addressCity: text('address_city'),
    emergencyContactName: text('emergency_contact_name'),
    emergencyContactRelationship: text('emergency_contact_relationship'),
    emergencyContactPhone: text('emergency_contact_phone'),
    caseStatus: patientCaseStatusEnum('case_status').default('INTAKE').notNull(),
    therapyGoal: text('therapy_goal'),
    therapyDiagnosisLabel: text('therapy_diagnosis_label'),
    therapyFrequencyText: text('therapy_frequency_text'),
    nextTherapyAt: timestamp('next_therapy_at', { withTimezone: true }),
    therapistNote: text('therapist_note'),
    therapistNoteAuthor: text('therapist_note_author'),
    therapistNoteAt: timestamp('therapist_note_at', { withTimezone: true }),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('patients_user_id_idx').on(table.userId)],
);

export const patientAssignments = pgTable(
  'patient_assignments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    staffUserId: uuid('staff_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    assignmentType: assignmentTypeEnum('assignment_type').default('PRIMARY_THERAPIST').notNull(),
    activeFrom: timestamp('active_from', { withTimezone: true }).defaultNow().notNull(),
    activeUntil: timestamp('active_until', { withTimezone: true }),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('patient_assignments_active_scope_idx').on(table.patientId, table.staffUserId, table.assignmentType),
  ],
);

export const patientsRelations = relations(patients, ({ one, many }) => ({
  user: one(users, {
    fields: [patients.userId],
    references: [users.id],
  }),
  assignments: many(patientAssignments),
}));

export const patientAssignmentsRelations = relations(patientAssignments, ({ one }) => ({
  patient: one(patients, {
    fields: [patientAssignments.patientId],
    references: [patients.id],
  }),
  staffUser: one(users, {
    fields: [patientAssignments.staffUserId],
    references: [users.id],
  }),
  createdByUser: one(users, {
    fields: [patientAssignments.createdBy],
    references: [users.id],
  }),
}));
