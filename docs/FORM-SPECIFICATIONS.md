---
title: Hafta Fisioterapi Form and Field Specifications
version: 0.2.0
status: candidate-clinical-fields-require-hafta-validation
last_updated: 2026-08-12
source_of_truth_for:
  - patient-profile-fields
  - intake-fields
  - assessment-form-structure
  - treatment-plan-fields
  - therapy-session-fields
---

# Form and Field Specifications

## 1. Important status

This document defines implementation structure and candidate fields. Clinical field wording and mandatory status must be reviewed by Hafta physiotherapists before production.

AI Agent must not treat `candidate` clinical fields as medically authoritative.

## 2. Field metadata convention

Every significant form field should conceptually define:

```ts
type FieldDefinition = {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'number' | 'select' | 'multi-select' | 'boolean' | 'file';
  owner: 'PATIENT' | 'THERAPIST' | 'STAFF' | 'SYSTEM';
  sensitivity: 'STANDARD' | 'PERSONAL' | 'HEALTH' | 'SECURITY';
  required: boolean | 'CONDITIONAL';
  patientVisible: boolean | 'CONFIGURABLE';
  editableStates: string[];
  notes?: string;
};
```

Do not literally create a runtime registry for all fields unless architecture benefits from it.

## 3. Registration fields

| Key                  | Type       | Owner   | Sensitivity | Required | Notes                          |
| -------------------- | ---------- | ------- | ----------- | -------: | ------------------------------ |
| fullName             | text       | PATIENT | PERSONAL    |      yes | account/profile bootstrap only |
| email                | text/email | PATIENT | PERSONAL    |      yes | auth identifier                |
| password             | password   | PATIENT | SECURITY    |      yes | handled by auth layer          |
| passwordConfirmation | password   | PATIENT | SECURITY    |      yes | never stored                   |
| acceptTerms          | boolean    | PATIENT | STANDARD    |      yes | version/reference recommended  |
| acknowledgePrivacy   | boolean    | PATIENT | STANDARD    |      yes | version/reference recommended  |

`role`, `permissions`, `accountStatus`, `emailVerified`, `patientId` are not user-editable registration fields.

## 4. Patient profile candidate fields

### Identity

| Key                          | Type   | Sensitivity             |      Required | Patient editable |
| ---------------------------- | ------ | ----------------------- | ------------: | ---------------: |
| fullName                     | text   | PERSONAL                |           yes |              yes |
| preferredName                | text   | PERSONAL                |            no |              yes |
| dateOfBirth                  | date   | PERSONAL/HEALTH-CONTEXT | candidate yes | yes, with policy |
| sexOrRelevantBiologicalField | select | HEALTH                  |   conditional |              yes |
| occupation                   | text   | PERSONAL                |  no/candidate |              yes |

Only collect sex/gender/biological information if clinically/operationally needed and terminology is approved.

### Contact

| Key         | Type        | Sensitivity |      Required | Patient editable |
| ----------- | ----------- | ----------- | ------------: | ---------------: |
| phone       | text/tel    | PERSONAL    | candidate yes |              yes |
| addressLine | textarea    | PERSONAL    |   conditional |              yes |
| city        | text/select | PERSONAL    |   conditional |              yes |
| postalCode  | text        | PERSONAL    |            no |              yes |

Apply data minimization. Do not require exact address unless operationally needed.

### Emergency contact

| Key                          | Type        | Sensitivity |  Required |
| ---------------------------- | ----------- | ----------- | --------: |
| emergencyContactName         | text        | PERSONAL    | candidate |
| emergencyContactRelationship | text/select | PERSONAL    | candidate |
| emergencyContactPhone        | tel         | PERSONAL    | candidate |

## 5. Patient intake candidate fields

### 5.1 Main complaint

| Key                | Type          | Sensitivity |      Required | Notes                                 |
| ------------------ | ------------- | ----------- | ------------: | ------------------------------------- |
| chiefComplaint     | textarea      | HEALTH      |           yes | patient own words                     |
| affectedArea       | text/select   | HEALTH      | yes/candidate | avoid diagnostic implication          |
| onsetDate          | date          | HEALTH      |   conditional | allow approximate timeframe if needed |
| onsetDescription   | textarea      | HEALTH      |     candidate | how it started                        |
| triggeringEvent    | textarea      | HEALTH      |  no/candidate | injury/activity event                 |
| symptomScale       | number/select | HEALTH      |   conditional | only if Hafta uses defined scale      |
| aggravatingFactors | textarea      | HEALTH      |     candidate | activities making complaint worse     |
| relievingFactors   | textarea      | HEALTH      |            no |                                       |
| dailyLimitations   | textarea      | HEALTH      | yes/candidate | function impact                       |

### 5.2 Activity and goals

| Key                  | Type     | Sensitivity    |      Required |
| -------------------- | -------- | -------------- | ------------: |
| dailyActivity        | textarea | HEALTH-CONTEXT |     candidate |
| sportActivity        | textarea | HEALTH-CONTEXT |            no |
| patientGoal          | textarea | HEALTH         | yes/candidate |
| returnToActivityGoal | textarea | HEALTH         |            no |

### 5.3 Relevant history

| Key                    | Type     | Sensitivity |     Required |
| ---------------------- | -------- | ----------- | -----------: |
| previousInjuryHistory  | textarea | HEALTH      |    candidate |
| surgeryHistory         | textarea | HEALTH      |    candidate |
| relevantMedicalHistory | textarea | HEALTH      |    candidate |
| currentMedication      | textarea | HEALTH      |  conditional |
| allergies              | textarea | HEALTH      |  conditional |
| previousTreatment      | textarea | HEALTH      | no/candidate |

Never use AI to infer diagnosis from these free-text fields in v1.

### 5.4 Supporting documents

Optional fields/attachments:

- referral document;
- prior examination summary;
- imaging/report provided by patient;
- other supporting document approved by Hafta.

Do not require unnecessary medical documents.

### 5.5 Consents

Separate consent records where needed:

- data processing/privacy acknowledgement;
- submission accuracy acknowledgement;
- treatment/service consent if workflow/legal review requires;
- media/publication consent — **separate optional consent**;
- communication consent if applicable.

Never bundle marketing/media consent into required clinical data consent.

## 6. Intake review staff fields

Candidate system/staff fields:

- reviewStatus;
- reviewedBy;
- reviewedAt;
- revisionRequestedAt;
- patientVisibleRevisionMessage;
- acceptedAt;
- acceptedBy.

Internal review notes, if created, must be distinct from patient-facing revision message.

## 7. Assessment candidate structure

### Metadata

- assessmentId;
- patientId;
- therapistId;
- assessmentDate;
- status `DRAFT | FINALIZED | AMENDED | ARCHIVED`;
- version;
- patientVisible;
- createdAt;
- updatedAt;
- finalizedAt;
- finalizedBy.

### Subjective section

Candidate fields:

- subjectiveComplaintSummary;
- historyOfPresentCondition;
- symptomBehavior;
- functionalLimitations;
- patientGoalsSummary;
- relevantHistorySummary.

### Objective section

Because physiotherapy evaluation varies by complaint, prefer extensible structured groups rather than hundreds of hardcoded universal fields.

Candidate core:

- observationNotes;
- functionalMovementNotes;
- rangeOfMotionNotes/measurements if used;
- strengthNotes/measurements if used;
- palpation/other finding only if part of workflow;
- specialTestResults as structured rows if approved;
- baselineOutcomeMeasure if approved.

### Clinical interpretation

Candidate:

- problemList;
- clinicalAssessmentSummary;
- precautionNotes;
- referralConsideration;
- therapistInternalNotes.

These are therapist-owned and not automatically patient-visible.

### Patient-safe summary

Separate field recommended:

```text
patientSummary
```

This avoids exposing raw internal notes when therapist wants a concise patient-visible explanation.

## 8. Treatment plan candidate fields

- treatmentPlanId;
- linkedAssessmentId;
- goals;
- functionalGoals;
- plannedInterventions;
- homeProgramSummary;
- plannedReviewDate/interval if used;
- precautions;
- progressCriteria;
- patientSummary;
- patientVisible;
- status/version/finalization metadata.

## 9. Therapy session candidate fields

### Metadata

- sessionId;
- patientId;
- therapistId;
- treatmentPlanId optional;
- sessionDateTime;
- status;
- version;
- patientVisible;
- finalizedAt.

### Clinical content

Candidate:

- preSessionStatus;
- interventionSummary;
- interventionItems structured optional;
- responseToIntervention;
- measurementProgress;
- homeProgramUpdate;
- nextPlan;
- patientSummary;
- internalNotes.

### Visibility

`internalNotes` default patient-invisible.

`patientSummary` can be patient-visible when finalized and configured.

## 10. Amendment fields

For finalized records, amendment should record:

- parent/original record reference;
- version number;
- amendmentReason;
- amendedBy;
- amendedAt;
- new content snapshot/structured delta according to architecture;
- original remains recoverable.

No silent overwrite.

## 11. Validation guidance

### Text

- trim where appropriate;
- practical max length;
- reject invalid encoding/control abuse;
- do not over-sanitize text in a way that destroys legitimate clinical notes; output encoding/React escaping remains important.

### Dates

- date of birth cannot be future;
- session date rules follow business policy;
- do not assume all historical dates are exact if intake allows approximate onset.

### Number/scale

- enforce defined min/max;
- store scale meaning/version if clinically meaningful.

### Select enums

Server owns enum allowlist. Do not accept arbitrary unknown option from client.

### File

- MIME allowlist;
- extension consistency check where practical;
- max size;
- object key generated server-side;
- private access;
- content scanning strategy before production if needed.

## 12. Form UX requirements

- label every field;
- optional vs required clear;
- explain why sensitive field is requested when not obvious;
- preserve user input on validation errors;
- support draft for long intake/clinical forms;
- warn on unsaved changes;
- finalization separate from draft save;
- never use disabled button as only explanation of missing requirement;
- error summary for long forms recommended;
- no hidden clinical fields controlled only by CSS.

## 13. Sensitive data logging rule

Never log full values for:

- complaint;
- history;
- medication;
- allergies;
- clinical notes;
- address;
- document filename if identifying;
- password/token.

Audit should log event metadata, not duplicate full record body.

## 14. Production validation gate

Before enabling real patient intake:

- [ ] Hafta therapist approves clinical fields;
- [ ] required vs optional reviewed;
- [ ] privacy/legal basis reviewed;
- [ ] consent copy approved;
- [ ] retention policy decided;
- [ ] document upload limits decided;
- [ ] patient-visible fields decided;
- [ ] test fixtures remain dummy only.
