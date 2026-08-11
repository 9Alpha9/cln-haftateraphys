---
title: Hafta Fisioterapi ADMIN Therapist Dashboard Specification
version: 0.3.0
status: implementation-ready-with-clinical-workflow-validation-pending
last_updated: 2026-08-12
source_of_truth_for:
  - admin-dashboard
  - therapist-workflow
  - patient-clinical-records
---

# ADMIN / Therapist Dashboard Specification

> **UI implementation contract:** read `docs/DESIGN-REFERENCES.md`, `docs/DESIGN-SYSTEM.md`, and `docs/MOBILE-FIRST-STRATEGY.md`. Build and pass the mobile version first; desktop enhancement is not allowed before Mobile Gate passes.


## 1. Role model

`ADMIN` is a staff role with scoped permissions. It may be combined with staff subtype such as:

```text
THERAPIST
STAFF
```

Sub-type does not replace permission checks.

Recommended authorization:

```text
role == ADMIN
AND permission present
AND patient assignment/scope allowed
AND record state allows action
```

## 2. Information architecture

Therapist baseline:

```text
/dashboard
/dashboard/patients
/dashboard/patients/[patientId]
/dashboard/patients/[patientId]/intake
/dashboard/patients/[patientId]/assessment
/dashboard/patients/[patientId]/treatment-plan
/dashboard/patients/[patientId]/sessions
/dashboard/patients/[patientId]/sessions/[sessionId]
/dashboard/patients/[patientId]/history
/dashboard/account/security
```

Staff administrative subtype may have reduced navigation.

## 3. Dashboard home

### Objective
Show operational priorities, not vanity metrics.

### Candidate modules

- assigned patients needing review;
- intake submissions awaiting review;
- draft assessments/sessions requiring completion;
- recent assigned patient activity;
- optional today schedule only if scheduling feature exists;
- security/account notice.

### Avoid

- exposing all patient complaint summaries on dashboard;
- total patient count if not operationally useful;
- decorative analytics without clinical purpose.

## 4. Patient list

### Route

```text
/dashboard/patients
```

### Required capabilities

- server-side search;
- pagination;
- case status filter;
- assigned therapist filter if permitted;
- intake status filter;
- sort by recent activity / name / relevant safe field;
- clear no-result/empty state.

### Safe table columns candidate

- patient display name;
- patient reference/code if used;
- case status;
- intake status;
- assigned therapist;
- latest activity date;
- action `Buka`.

Avoid default list columns:

- full complaint text;
- full DOB;
- phone;
- address;
- detailed diagnosis/clinical finding.

### Query rule
Only return rows within authorized scope.

Do not query all patients and filter client-side.

## 5. Patient detail shell

### Route

```text
/dashboard/patients/[patientId]
```

### Page structure

Header:

- patient display name;
- patient reference;
- case status;
- assigned therapist;
- safe quick actions based on permission.

Tabs/sections:

1. Overview
2. Intake
3. Assessment
4. Treatment Plan
5. Sessions
6. History
7. Documents [enabled]

Tabs hidden based on permission but direct routes remain server protected.

### Minimum patient overview

- demographics needed for care;
- emergency contact if needed;
- chief complaint summary;
- intake status;
- latest finalized clinical status;
- assignment;
- recent activity.

## 6. Intake review

### Route

```text
/dashboard/patients/[patientId]/intake
```

### Required actions

Based on permission:

- read submission;
- mark under review;
- request revision;
- accept;
- add internal administrative review note if product approves.

### Lifecycle

```text
DRAFT
 -> SUBMITTED
 -> UNDER_REVIEW
 -> ACCEPTED

UNDER_REVIEW
 -> NEEDS_REVISION
 -> SUBMITTED
```

Do not use intake acceptance as clinical diagnosis.

### Request revision UX

Must contain:

- field/section needing update;
- patient-safe reason;
- audit event;
- no internal-only commentary accidentally sent to patient.

## 7. Initial assessment

### Route

```text
/dashboard/patients/[patientId]/assessment
```

### Access

- `assessment:read` to view;
- `assessment:create` to create;
- `assessment:update-draft` to edit draft;
- `assessment:finalize` to finalize;
- `assessment:amend` to amend finalized record.

### Candidate sections

Clinical field set requires validation by Hafta therapist. Baseline structure:

#### Subjective

- primary complaint;
- history of present complaint;
- symptom behavior;
- activity limitation;
- patient goal;
- relevant history.

#### Objective

- observation;
- movement/function findings;
- range/measurement fields if used;
- strength/function tests if used;
- relevant special examination/test fields if approved;
- pain/other scale if used.

#### Clinical interpretation

- therapist assessment/impression;
- identified problems;
- precautions/red flags/referral need if part of Hafta workflow.

#### Plan

- goal linkage;
- recommended treatment direction;
- review plan;
- visibility to patient.

### Draft vs finalized

Draft:

- editable by authorized owner/scoped therapist;
- clearly labeled DRAFT;
- not automatically patient-visible.

Finalized:

- immutable through ordinary edit;
- correction only via amendment/revision;
- finalized timestamp and actor;
- audit event.

### Finalize dialog

Must state:

- record becomes finalized;
- ordinary edit disabled;
- correction requires amendment;
- patient visibility status if relevant.

## 8. Treatment plan

### Route

```text
/dashboard/patients/[patientId]/treatment-plan
```

### Candidate fields

- linked assessment;
- short-term goals;
- long-term/functional goals if used;
- planned interventions;
- home program plan;
- frequency/review interval if part of workflow;
- precautions;
- progress criteria;
- patient-visible summary;
- status.

### Lifecycle

```text
DRAFT -> FINALIZED -> AMENDED
```

No hard delete.

## 9. Therapy sessions

### Routes

```text
/dashboard/patients/[patientId]/sessions
/dashboard/patients/[patientId]/sessions/[sessionId]
```

### Session list

Show:

- session date/time;
- therapist;
- status;
- short safe summary;
- patient visibility indicator;
- draft/finalized state.

### Session record candidate sections

- date/time;
- therapist;
- relevant pre-session status;
- intervention performed;
- response/tolerance;
- measurable progress if used;
- home program/update;
- next plan;
- patient-safe summary;
- internal notes if approved;
- patient visibility;
- state.

### Create session rule
Must belong to authorized patient and appropriate assignment/scope.

### Finalization
Same immutable/amendment pattern as assessment.

## 10. Clinical history

### Route

```text
/dashboard/patients/[patientId]/history
```

### Purpose
Chronological clinical timeline for authorized staff.

Candidate timeline events:

- intake submitted/accepted;
- assignment;
- assessment finalized/amended;
- treatment plan finalized/amended;
- session finalized/amended;
- document added;
- case status changed;
- completion/referral/archive.

Audit trail is **not** the same as clinical history. Do not expose low-level security logs in clinical timeline.

## 11. Patient assignment

### Permission

```text
patient:assign
```

### Rules

- assignment update audited;
- assignment has active/inactive/history model if needed;
- unassignment must not destroy previous authorship/history;
- reassignment should not rewrite historical therapist ownership;
- new authorization scope takes effect on next request.

## 12. Case status

Candidate:

```text
INTAKE
ACTIVE
ON_HOLD
COMPLETED
REFERRED
ARCHIVED
```

Final labels require Hafta validation.

Status change must be permission-controlled and audited when meaningful.

## 13. Export

Default denied.

If enabled:

```text
permission = patient:export
AND scope allowed
AND explicit user action
AND audit created
```

Export UI must explain sensitive nature. Avoid mass export in v1 unless explicitly required.

## 14. Documents

Authorized staff may upload/read documents according to permission.

Rules:

- private storage;
- signed URL after auth;
- MIME/size validation;
- metadata in database;
- no patient name in object key;
- download audit for sensitive documents if required;
- archive rather than silent delete for records that must be retained.

## 15. Administrative staff subtype

`ADMIN/STAFF` may be given limited permission such as:

- patient:list safe subset;
- patient demographic management;
- intake administrative review subset;
- assignment support if approved.

Default deny:

- clinical assessment notes;
- treatment plan details;
- session internal notes;
- clinical export.

## 16. Data conflict/concurrency

At minimum detect record state change before mutation.

Examples:

- therapist opens DRAFT;
- another authorized user finalizes it;
- first user tries saving stale form.

Server must reject invalid mutation with safe conflict state, not overwrite finalized record.

Optional optimistic locking can use `updatedAt`/version number.

## 17. Audit events

Minimum candidates:

```text
PATIENT_VIEWED
PATIENT_UPDATED
PATIENT_ASSIGNED
INTAKE_REVIEW_STARTED
INTAKE_REVISION_REQUESTED
INTAKE_ACCEPTED
ASSESSMENT_CREATED
ASSESSMENT_UPDATED
ASSESSMENT_FINALIZED
ASSESSMENT_AMENDED
TREATMENT_PLAN_CREATED
TREATMENT_PLAN_FINALIZED
TREATMENT_PLAN_AMENDED
SESSION_CREATED
SESSION_UPDATED
SESSION_FINALIZED
SESSION_AMENDED
DOCUMENT_UPLOADED
DOCUMENT_DOWNLOADED
PATIENT_EXPORTED
CASE_STATUS_CHANGED
```

Audit payload must avoid copying full clinical text unnecessarily.

## 18. Component candidates

```text
components/patient/
├── list/
│   ├── PatientTable.tsx
│   ├── PatientFilters.tsx
│   └── PatientSearch.tsx
├── profile/
│   ├── PatientHeader.tsx
│   └── PatientOverview.tsx
├── intake/
│   ├── IntakeReview.tsx
│   └── RequestIntakeRevisionDialog.tsx
├── assessment/
│   ├── AssessmentForm.tsx
│   ├── AssessmentReadView.tsx
│   └── FinalizeAssessmentDialog.tsx
├── treatment-plan/
│   ├── TreatmentPlanForm.tsx
│   └── FinalizeTreatmentPlanDialog.tsx
├── sessions/
│   ├── TherapySessionList.tsx
│   ├── TherapySessionForm.tsx
│   └── FinalizeSessionDialog.tsx
└── history/
    └── ClinicalTimeline.tsx
```

## 19. Acceptance criteria

- [ ] patient list is server scoped;
- [ ] unassigned/non-permitted therapist cannot access patient by URL;
- [ ] staff subtype cannot read clinical data by default;
- [ ] assessment/treatment/session have draft/finalized/amend lifecycle;
- [ ] hard delete unavailable for clinical records;
- [ ] finalize operation atomic + audited;
- [ ] stale mutation cannot overwrite finalized record;
- [ ] patient visibility explicitly controlled;
- [ ] export default denied and audited;
- [ ] sensitive list views minimize data;
- [ ] authorization tests cover every clinical mutation family.
