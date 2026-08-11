---
title: Hafta Fisioterapi Database Design
version: 0.1.0
last_updated: 2026-08-12
---

# Database Design

## 1. Platform

Primary relational database: Neon PostgreSQL.
ORM/migration: Drizzle ORM.

File binary tidak disimpan di PostgreSQL. Simpan metadata di PostgreSQL dan object di private object storage.

## 2. General data rules

- Semua table utama memiliki stable ID.
- Tambahkan `created_at` dan `updated_at` bila relevan.
- Clinical table harus mempunyai lifecycle status.
- Clinical record final tidak hard-delete.
- Gunakan transaction untuk finalization + audit.
- Foreign key constraints wajib bila relasi membutuhkan integrity.
- Unique constraints harus dinyatakan di database, bukan hanya UI validation.
- Index hanya dibuat berdasarkan access pattern nyata.

## 3. Core entities

### 3.1 `users`
Authentication identity dikelola sesuai schema Better Auth/integration actual.

Jangan duplicate plaintext credential field di domain table.

### 3.2 `profiles`
Candidate fields:

- `user_id`
- `display_name`
- `phone`
- `avatar_key` optional
- `account_type`
- timestamps

### 3.3 `staff_profiles`

- `id`
- `user_id`
- `staff_type` (`THERAPIST`, `STAFF`)
- `professional_title` nullable
- `credential_summary` nullable
- `is_active`

### 3.4 `patients`

- `id`
- `user_id` nullable if staff-created pre-account record is later required
- `medical_record_number` optional internal unique identifier
- `full_name`
- `date_of_birth`
- `phone`
- `occupation` nullable
- `case_status`
- timestamps
- archive metadata

Do not collect fields not required by validated workflow.

### 3.5 `patient_emergency_contacts`

- `id`
- `patient_id`
- `name`
- `relationship`
- `phone`

### 3.6 `patient_assignments`

- `id`
- `patient_id`
- `staff_id`
- `assignment_type`
- `active_from`
- `active_until` nullable
- `created_by`

Partial unique/logic should prevent duplicate active assignment when inappropriate.

### 3.7 `patient_intakes`

- `id`
- `patient_id`
- `version`
- `status`
- `chief_complaint`
- `affected_area`
- `onset_text` or validated date fields
- `trigger_event`
- `complaint_scale` nullable
- `aggravating_factors`
- `relieving_factors`
- `functional_limitations`
- `injury_history`
- `surgery_history`
- `medical_history`
- `medications`
- `allergies`
- `patient_goal`
- `submitted_at`
- timestamps

Highly sensitive free-text fields must never be included in third-party analytics/logging.

### 3.8 `assessments`

- `id`
- `patient_id`
- `therapist_id`
- `intake_id` nullable/reference
- `status`
- `subjective_summary`
- `objective_findings`
- `functional_findings`
- `clinical_impression`
- `baseline_measurements` JSONB only if flexible structure is justified; prefer normalized fields for queryable metrics
- `patient_visible`
- `finalized_at`
- `finalized_by`
- timestamps

### 3.9 `assessment_amendments`

- `id`
- `assessment_id`
- `reason`
- `changes_summary`
- `created_by`
- `created_at`

Detailed version strategy can use immutable version rows instead; choose one model before implementation.

### 3.10 `treatment_plans`

- `id`
- `patient_id`
- `assessment_id`
- `therapist_id`
- `status`
- `goals`
- `planned_interventions`
- `review_plan`
- `home_program`
- `precautions`
- `patient_visible`
- `finalized_at`
- timestamps

### 3.11 `therapy_sessions`

- `id`
- `patient_id`
- `therapist_id`
- `treatment_plan_id` nullable
- `session_at`
- `status`
- `pre_session_state`
- `interventions`
- `response`
- `progress_measurements`
- `home_program_update`
- `next_plan`
- `patient_visible`
- `finalized_at`
- timestamps

### 3.12 `session_amendments`

Sama seperti assessment amendment; tidak replace original without history.

### 3.13 `patient_documents`

- `id`
- `patient_id`
- `uploaded_by`
- `storage_key`
- `original_filename` optional and protected
- `mime_type`
- `size_bytes`
- `document_type`
- `checksum` optional
- `patient_visible`
- `status`
- timestamps

Object storage bucket private.

### 3.14 `consents`

- `id`
- `patient_id`
- `consent_type`
- `policy_version`
- `granted`
- `granted_at`
- `revoked_at` nullable
- `evidence_metadata`

Consent media/publication harus terpisah dari privacy/service consent.

### 3.15 `roles`
Jika Better Auth/plugin menyimpan role secara sederhana, tetap pastikan domain permission model konsisten.

Role fixed baseline:

- `SUPER_ADMIN`
- `ADMIN`
- `USER`

### 3.16 `permissions`
Candidate permission keys didefinisikan di `PERMISSIONS.md`.

### 3.17 `role_permissions`
Mapping role -> permission bila menggunakan database-backed permission.

### 3.18 `user_permissions`
Optional explicit overrides. Avoid complexity unless truly needed.

### 3.19 `audit_logs`

- `id`
- `actor_user_id` nullable for system
- `actor_role_snapshot`
- `action`
- `resource_type`
- `resource_id`
- `patient_id` nullable
- `result` (`SUCCESS`, `DENIED`, `FAILED`)
- `request_id`
- `ip_hash` or privacy-conscious network metadata if policy allows
- `user_agent_summary` optional
- `metadata` limited JSONB, NEVER include raw clinical content/secrets
- `created_at`

Audit log should be append-only from normal application flows.

## 4. Relationship overview

```text
user 1---1 profile
user 1---0..1 staff_profile
user 1---0..1 patient

patient 1---N patient_intake
patient 1---N patient_assignment N---1 staff_profile
patient 1---N assessment
patient 1---N treatment_plan
patient 1---N therapy_session
patient 1---N patient_document
patient 1---N consent

assessment 1---N amendments
therapy_session 1---N amendments
```

## 5. Record lifecycle

Clinical record rules:

```text
DRAFT
  -> FINALIZED
      -> AMENDED (through explicit amendment/version)
      -> ARCHIVED (policy-driven, not ordinary delete)
```

A finalized record cannot silently return to draft.

## 6. Object-level access

Every patient-linked query must scope by authorization policy before returning data.

Examples:

- USER: `patient.user_id == session.user.id`
- therapist: active assignment OR explicit clinical permission according to policy
- staff: only minimum data required by role
- super admin: administrative access does not imply clinical data access

## 7. Sensitive field handling

Avoid putting clinical free text in:

- URL query params;
- cache keys;
- analytics events;
- error messages;
- audit metadata;
- client-side persistent storage.

## 8. Seed data

Development seed must use obviously fictitious names and complaints.

Do not seed from real Instagram patient stories.

## 9. Migration rules

Every schema change:

1. update `db/schema/*`;
2. generate/review migration;
3. verify backward/forward impact;
4. review data loss risk;
5. run against development database;
6. update docs if domain model changes.

Never use destructive migration against production without explicit reviewed plan.

## 10. Backup/recovery

Before production patient data, define:

- automated backup capability;
- retention;
- point-in-time recovery strategy if plan supports it;
- restore test;
- incident ownership.

Free-tier database limits are acceptable for development, not automatically sufficient for clinical production.
