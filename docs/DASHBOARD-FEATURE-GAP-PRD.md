---
title: Hafta Fisioterapi — Dashboard Feature Gap PRD Patch
version: 0.4.0-gap-patch
status: implementation-ready-delta
last_updated: 2026-08-14
language: Indonesian
scope:
  - appointment-scheduling
  - patient-progress-aggregation
  - dedicated-home-exercise
  - consent-lifecycle
  - notification-center
priority:
  p0:
    - appointment-scheduling
    - patient-progress-aggregation
    - dedicated-home-exercise
    - consent-lifecycle
  p1:
    - notification-center
non_goals:
  - rebuild-existing-dashboard
  - redo-patient-management
  - redo-intake
  - redo-assessment
  - redo-treatment-plan
  - redo-therapy-session
  - redo-history
  - redo-role-permission
  - redo-audit-log
  - redo-security-architecture
  - redo-landing-page
---

# Hafta Fisioterapi — Dashboard Feature Gap PRD Patch

> **IMPORTANT — DELTA ONLY**
>
> Dokumen ini **bukan PRD pengganti** dan **bukan instruksi untuk menjalankan ulang fitur yang sudah selesai**.
>
> AI Agent wajib memperlakukan dokumen ini sebagai **patch tambahan** terhadap PRD dan codebase yang sudah ada.
>
> Sebelum coding, agent harus **memeriksa implementasi existing** dan hanya menambahkan bagian yang memang belum tersedia.

## 1. Tujuan Patch

PRD sebelumnya sudah mencakup core workflow berikut:

```text
Patient Management
Patient Profile
Patient Intake
Assessment
Treatment Plan
Therapy Sessions
Therapist Assignment
Clinical History
Documents
Role / Permission
Audit Log
Account Security
System Settings
Export Security
```

Bagian-bagian tersebut **tidak dikerjakan ulang melalui patch ini**.

Patch ini hanya menambahkan atau meningkatkan:

```text
1. Appointment / Scheduling
2. Patient Progress Aggregation
3. Dedicated Home Exercise Program
4. Consent Lifecycle Management
5. Notification Center
```

## 2. Rules untuk AI Agent

### MUST

- inspect existing code before creating new route/table/component;
- reuse existing patient, therapist, session, treatment-plan, auth, permission, audit, and design-system architecture;
- implement mobile-first;
- preserve current route/UI behavior unless this patch explicitly changes it;
- use server-side authorization;
- use current role/permission architecture;
- use current Neon + Drizzle setup;
- use current security architecture patch for protected routes;
- add audit events for sensitive mutations;
- use dummy/de-identified data during development;
- keep clinical field assumptions minimal until validated by Hafta therapist.

### MUST NOT

AI Agent **dilarang**:

```text
✕ rerun project bootstrap
✕ rebuild landing page
✕ rebuild authentication
✕ rebuild Patient Management
✕ rebuild Patient Intake
✕ rebuild Assessment
✕ rebuild Treatment Plan
✕ rebuild Therapy Session
✕ rebuild Clinical History
✕ rebuild Role / Permission
✕ rebuild Audit Log
✕ replace Better Auth
✕ replace Neon
✕ replace Drizzle
✕ migrate to monorepo
✕ change current dashboard architecture without requirement
```

Jika fungsi existing sudah dapat memenuhi requirement baru, **extend**, jangan duplicate.

## 3. Priority

### P0 — Required untuk next dashboard iteration

```text
GAP-001 Appointment / Scheduling
GAP-002 Patient Progress
GAP-003 Home Exercise Program
GAP-004 Consent Lifecycle
```

### P1 — Setelah P0 stabil

```text
GAP-005 Notification Center
```

## 4. GAP-001 — Appointment / Scheduling

### 4.1 Objective

Menyediakan sistem penjadwalan terapi yang terstruktur sehingga Hafta tidak hanya menyimpan tanggal pada history/session.

Appointment adalah resource tersendiri.

```text
Appointment ≠ Therapy Session
```

Appointment:

```text
planned / scheduled visit
```

Therapy Session:

```text
clinical record setelah terapi dilakukan
```

Keduanya dapat terhubung tetapi tidak boleh dianggap sama.

### 4.2 Candidate Routes

Shared:

```text
/dashboard/appointments
```

ADMIN / Therapist:

```text
/dashboard/appointments
/dashboard/appointments/new
/dashboard/appointments/[appointmentId]
```

USER / Patient:

```text
/dashboard/appointments
/dashboard/appointments/[appointmentId]
```

Jika current project memilih route lain yang sudah ada, **reuse route existing** dan jangan membuat duplicate.

### 4.3 Data Contract

Candidate model:

```text
appointment
├── id
├── patientId
├── therapistId
├── scheduledDate
├── startTime
├── endTime OR durationMinutes
├── type
├── status
├── administrativeNote
├── cancellationReason
├── rescheduledFromId
├── createdBy
├── createdAt
└── updatedAt
```

Do not store unnecessary clinical details in appointment record.

### 4.4 Appointment Status

Minimum:

```text
SCHEDULED
CONFIRMED
COMPLETED
CANCELLED
RESCHEDULED
NO_SHOW
```

Optional future:

```text
CHECKED_IN
```

Do not add optional states unless workflow requires them.

### 4.5 Appointment Type

Candidate:

```text
INITIAL_ASSESSMENT
THERAPY_SESSION
FOLLOW_UP
EVALUATION
```

Final terminology must follow Hafta workflow.

### 4.6 ADMIN / Therapist Capabilities

Authorized staff may:

```text
✓ create appointment
✓ choose patient
✓ assign therapist if permitted
✓ set date
✓ set time
✓ set duration
✓ reschedule
✓ cancel
✓ mark no-show
✓ mark completed
✓ filter appointment
✓ view own / scoped schedule
```

ADMIN/Staff yang tidak memiliki clinical permission tetap dapat diberi appointment management permission tanpa clinical note access.

### 4.7 USER Capabilities

Default MVP:

```text
✓ view own upcoming appointment
✓ view own appointment history
✓ see date
✓ see time
✓ see therapist
✓ see appointment status
```

Default denied:

```text
✕ change therapist
✕ create arbitrary appointment
✕ edit status
✕ view other patient schedule
```

Patient self-booking / rescheduling **bukan default MVP**.

Jika nanti Hafta ingin pasien mengajukan perubahan:

```text
REQUEST_RESCHEDULE
```

harus menjadi separate workflow, bukan direct mutation appointment.

### 4.8 Calendar Views

ADMIN / Therapist:

```text
Day
Week
Month
```

MVP minimum boleh:

```text
List + Day
```

jika calendar UI penuh belum diperlukan.

Mobile first:

```text
mobile → agenda/list
desktop → calendar enhancement
```

Jangan memaksakan month grid desktop ke mobile.

### 4.9 Conflict Validation

Server harus mencegah obvious schedule conflict:

```text
same therapist
overlapping active appointment
```

Conflict rule applies to active states such as:

```text
SCHEDULED
CONFIRMED
```

Cancelled/rescheduled historical record tidak dianggap slot aktif.

### 4.10 Appointment Security

Required checks:

```text
session
↓
appointment permission
↓
patient scope
↓
therapist scope
↓
resource access
```

USER:

```text
appointment.patient.userId == session.user.id
```

Therapist:

```text
appointment.therapistId == currentTherapist
OR explicit scheduling scope
```

SUPER_ADMIN:

system permissions still apply.

### 4.11 Appointment Audit Events

Candidate:

```text
APPOINTMENT_CREATED
APPOINTMENT_RESCHEDULED
APPOINTMENT_CANCELLED
APPOINTMENT_COMPLETED
APPOINTMENT_NO_SHOW
APPOINTMENT_THERAPIST_CHANGED
```

Do not log unnecessary clinical data.

### 4.12 Appointment UI

Patient mobile card:

```text
Next Appointment

16 Aug 2026
10:00

Therapist
[Name]

Status
CONFIRMED

[View Detail]
```

Staff mobile card:

```text
10:00
Patient Name

THERAPY SESSION
CONFIRMED
```

Desktop may enhance to calendar/table after mobile gate passes.

### 4.13 Acceptance Criteria — GAP-001

- [ ] Appointment exists independently from Therapy Session.
- [ ] Staff can create appointment with permission.
- [ ] Staff can reschedule/cancel with audit.
- [ ] USER only sees own appointments.
- [ ] Therapist sees only scoped schedule unless broader permission exists.
- [ ] Schedule conflict validation runs server-side.
- [ ] No sensitive clinical notes exposed in calendar cards.
- [ ] Mobile appointment experience works before desktop calendar enhancement.
- [ ] Authorization tests pass.

## 5. GAP-002 — Patient Progress Aggregation

### 5.1 Objective

PRD existing sudah menyimpan progress di:

```text
Assessment baseline
Treatment Plan progress criteria
Therapy Session measurements/progress
```

Patch ini **tidak membuat ulang clinical session data**.

Patch ini membuat **aggregation/presentation layer** untuk menjawab:

```text
Apakah kondisi pasien membaik?
Bagaimana progress dari session ke session?
Apakah goal mendekati target?
```

### 5.2 Candidate Routes

Patient:

```text
/dashboard/progress
```

Staff:

```text
/dashboard/patients/[patientId]/progress
```

Jika current patient detail tabs lebih cocok, route dedicated tidak wajib.

### 5.3 Data Source

Prefer existing data:

```text
assessment baseline
therapy session measurement
pain/complaint score
functional measurement
treatment goal
```

Do NOT duplicate data unless aggregation genuinely requires normalized measurement records.

### 5.4 Progress Metric Model

Generic candidate:

```text
progress_metric
├── id
├── patientId
├── metricKey
├── metricLabel
├── numericValue
├── unit
├── sourceType
├── sourceId
├── measuredAt
├── recordedBy
└── patientVisible
```

This model is OPTIONAL.

Agent must first inspect current session/assessment schema.

If existing fields can support aggregation safely:

```text
DO NOT create progress_metric table.
```

### 5.5 Candidate Metrics

Only metrics approved in actual Hafta workflow.

Examples:

```text
Pain / complaint scale
Range of movement
Functional score
Strength score
Activity tolerance
Patient-specific goal progress
```

Do not invent medical scoring systems.

### 5.6 Patient Progress UI

Mobile first.

Candidate:

```text
Progress

Pain
8 → 5 → 3

Sessions
6 completed

Current Goal
Return to Sport

Progress
70%
```

Graph is allowed if meaningful.

Do not use misleading fake precision.

### 5.7 Staff Progress UI

Patient detail may show:

```text
Baseline
Current
Target
Trend
Last measured
```

### 5.8 Patient Visibility

Not all metrics are automatically patient-visible.

Required:

```text
patientVisible = true
```

or equivalent existing visibility policy.

Internal therapist interpretation remains internal.

### 5.9 Acceptance Criteria — GAP-002

- [ ] Existing assessment/session data reused where possible.
- [ ] No duplicate clinical record creation.
- [ ] Progress page aggregates authorized records only.
- [ ] USER only sees own patient-visible metrics.
- [ ] Therapist only sees assigned/scoped patient.
- [ ] Mobile layout works without wide data tables.
- [ ] No invented medical scoring systems.
- [ ] Missing metrics show safe empty state.
- [ ] Authorization tests pass.

## 6. GAP-003 — Dedicated Home Exercise Program

### 6.1 Objective

Existing PRD already references:

```text
Treatment Plan → home program
Therapy Session → home program changes
```

Patch ini mengubahnya menjadi resource yang lebih usable bagi pasien.

It does **not** replace Treatment Plan.

Relationship:

```text
Treatment Plan
      ↓
Home Exercise Program
      ↓
Exercise Items
```

### 6.2 Candidate Routes

USER:

```text
/dashboard/exercises
```

ADMIN/Therapist:

```text
/dashboard/patients/[patientId]/exercises
```

### 6.3 Home Program Model

Candidate:

```text
home_program
├── id
├── patientId
├── treatmentPlanId
├── status
├── startsAt
├── endsAt
├── patientVisible
├── createdBy
├── createdAt
└── updatedAt
```

Exercise item:

```text
home_program_item
├── id
├── homeProgramId
├── name
├── instruction
├── sets
├── repetitions
├── durationSeconds
├── frequencyText
├── precaution
├── sortOrder
└── status
```

Do not force every field when clinically irrelevant.

### 6.4 Status

Program:

```text
DRAFT
ACTIVE
COMPLETED
ARCHIVED
```

Exercise item optional:

```text
ACTIVE
PAUSED
COMPLETED
```

### 6.5 Therapist Capabilities

Authorized therapist:

```text
✓ create home program
✓ link to treatment plan
✓ add exercise
✓ update draft
✓ activate
✓ revise
✓ archive
```

Clinical exercise instruction should be entered by authorized therapist.

**AI must not generate treatment recommendation automatically.**

### 6.6 Patient Capabilities

USER:

```text
✓ view active program
✓ view instructions
✓ view sets/reps/duration
✓ view precautions
✓ view previous programs if allowed
```

MVP does not require:

```text
✕ patient editing clinical exercise prescription
✕ AI recommendation
```

Optional future:

```text
mark as completed
self-reported adherence
```

Do not implement unless requested later.

### 6.7 UI

Patient mobile first:

```text
Latihan Saya

Hamstring Stretch
3 sets
30 detik
2x sehari

[View Instructions]
```

### 6.8 Audit

Candidate:

```text
HOME_PROGRAM_CREATED
HOME_PROGRAM_ACTIVATED
HOME_PROGRAM_UPDATED
HOME_PROGRAM_ARCHIVED
```

### 6.9 Acceptance Criteria — GAP-003

- [ ] Home Exercise reuses/link existing Treatment Plan.
- [ ] Therapist authorization required for clinical instructions.
- [ ] USER cannot edit prescription.
- [ ] USER only sees own patient-visible program.
- [ ] Program lifecycle is clear.
- [ ] No AI treatment generation.
- [ ] Mobile patient experience works.
- [ ] Authorization tests pass.

## 7. GAP-004 — Consent Lifecycle Management

### 7.1 Objective

Existing PRD already has consent requirements.

Patch ini **tidak menghapus consent existing**.

Patch ini adds lifecycle/version tracking so consent is auditable.

### 7.2 Consent Types

Baseline candidate:

```text
PRIVACY_DATA_PROCESSING
CLINICAL_SERVICE
DOCUMENT_UPLOAD
MEDIA_PUBLICATION
TESTIMONIAL_PUBLICATION
```

Do not combine optional publication consent with required clinical/data consent.

### 7.3 Consent Model

Candidate:

```text
consent
├── id
├── patientId
├── type
├── policyVersion
├── status
├── grantedAt
├── withdrawnAt
├── source
├── capturedBy
├── createdAt
└── metadataSafe
```

Status:

```text
PENDING
GRANTED
WITHDRAWN
EXPIRED
SUPERSEDED
```

Only use `EXPIRED` if policy/workflow genuinely requires expiration.

### 7.4 Policy Version

Every consent must know **what version** user agreed to.

Example:

```text
Privacy Notice v1.2
Granted:
14 Aug 2026
```

If policy changes:

```text
old consent → SUPERSEDED
new consent → PENDING/GRANTED
```

Exact re-consent policy needs operational/legal validation.

### 7.5 Consent UI — USER

Candidate:

```text
Consent & Privacy

Data Processing
GRANTED
14 Aug 2026

Clinical Service
GRANTED
14 Aug 2026

Media Publication
NOT GRANTED
```

Do not pressure user to grant optional publication consent.

### 7.6 Staff / Super Admin

Staff may view consent status only when permission requires.

SUPER_ADMIN can manage consent policy configuration/version, but cannot silently change a patient decision from denied to granted.

### 7.7 Withdrawal

If consent type can be withdrawn:

```text
USER request / authorized workflow
      ↓
server validation
      ↓
WITHDRAWN
      ↓
audit
```

Withdrawal must not delete historical consent record.

### 7.8 Audit Events

```text
CONSENT_GRANTED
CONSENT_WITHDRAWN
CONSENT_SUPERSEDED
CONSENT_POLICY_UPDATED
```

### 7.9 Acceptance Criteria — GAP-004

- [ ] Existing consent requirement preserved.
- [ ] Consent has type and version.
- [ ] Optional media consent remains separate.
- [ ] Historical consent is not hard-deleted.
- [ ] Patient can see own consent status.
- [ ] Staff cannot forge patient consent.
- [ ] Sensitive mutations audited.
- [ ] Authorization tests pass.

## 8. GAP-005 — Notification Center (P1)

### 8.1 Objective

Notification Center memberi informasi operasional kepada user tanpa menggantikan email/WhatsApp strategy.

This feature is **P1**.

Do not block P0 release because notification center is unfinished.

### 8.2 Candidate Route

```text
/dashboard/notifications
```

### 8.3 Candidate Notification Events

```text
APPOINTMENT_CREATED
APPOINTMENT_RESCHEDULED
APPOINTMENT_CANCELLED
APPOINTMENT_REMINDER
INTAKE_REVISION_REQUESTED
TREATMENT_PLAN_UPDATED
HOME_PROGRAM_UPDATED
SECURITY_ALERT
```

Do not send internal therapist notes.

### 8.4 Notification Model

Candidate:

```text
notification
├── id
├── userId
├── type
├── title
├── bodySafe
├── targetUrl
├── readAt
├── createdAt
└── expiresAt
```

Avoid storing sensitive clinical content in notification body.

### 8.5 Status

Derived:

```text
UNREAD = readAt is null
READ   = readAt exists
```

### 8.6 USER Experience

Mobile:

```text
Notifications

Appointment tomorrow
16 Aug • 10:00
Unread

Treatment plan updated
View details
```

Push notification is out of scope.

### 8.7 Security Notification

Examples:

```text
Password changed
New device/session
Account recovery
```

No secret or token may appear in notification text.

### 8.8 Acceptance Criteria — GAP-005

- [ ] P1 only; does not block P0.
- [ ] Notifications are scoped to current user.
- [ ] Sensitive clinical notes are not embedded.
- [ ] Read/unread works.
- [ ] Target URL authorization still runs normally.
- [ ] Security notification contains no secrets.
- [ ] Mobile experience works.

## 9. Dashboard Role Delta

This section only adds navigation related to this patch.

### USER

Existing navigation remains.

Add when feature enabled:

```text
Dashboard
Profile
Intake
Appointments     ← GAP-001
Progress         ← GAP-002
History
Exercises        ← GAP-003
Documents
Consent/Privacy  ← GAP-004
Security
Notifications    ← GAP-005 P1
```

Mobile bottom navigation should remain limited.

Candidate:

```text
Home
Treatment
Schedule
History
Profile
```

Additional modules may live under `More`.

### ADMIN / Therapist

Add:

```text
Appointments
Patient Progress
Home Exercise
```

Do not automatically expose:

```text
Users
Roles
Audit Logs
System Settings
```

unless existing permission grants them.

### SUPER_ADMIN

Add only governance where needed:

```text
Appointment system visibility/config
Consent policy/version governance
Notification configuration (P1)
```

SUPER_ADMIN still does not automatically get unrestricted clinical read.

## 10. Permission Delta

Reuse existing permission framework.

Candidate new keys:

```text
appointment:list
appointment:read
appointment:create
appointment:update
appointment:cancel
appointment:reschedule
appointment:complete

progress:read
progress:read-own

home-program:read
home-program:read-own
home-program:create
home-program:update
home-program:activate
home-program:archive

consent:read-own
consent:read
consent:manage-policy

notification:read-own
```

Do not add all keys blindly.

Agent must inspect current permission naming conventions first.

## 11. Database Delta Strategy

**Do not redesign the database.**

Agent sequence:

```text
inspect existing schema
        ↓
can current schema support feature?
        │
        ├── YES
        │    → reuse / extend
        │
        └── NO
             → add smallest required schema delta
```

Likely new resources:

```text
appointments
home_programs
home_program_items
consents
notifications (P1)
```

`progress_metrics` is optional and only added if existing assessment/session data cannot support reliable aggregation.

## 12. Mobile-First Requirement

All new modules follow existing project strategy:

```text
Mobile implementation
      ↓
Mobile Gate
      ↓
Tablet enhancement
      ↓
Desktop enhancement
      ↓
Cross-breakpoint QA
```

Mobile baseline widths:

```text
320
360
390
430
```

Do not build desktop calendar/table first and shrink it afterward.

## 13. Empty / Loading / Error States

Every new feature requires:

```text
loading
empty
error
forbidden
success
```

Examples:

Appointment empty:

```text
Belum ada jadwal terapi.
```

Progress empty:

```text
Progress akan muncul setelah terdapat data evaluasi yang dapat ditampilkan.
```

Exercise empty:

```text
Belum ada program latihan aktif.
```

Consent:

```text
Belum ada consent record untuk jenis ini.
```

Do not leak security details in forbidden state.

## 14. Dashboard Overview Delta

Existing dashboard should not be rebuilt.

Only add modules if useful.

### Patient USER

Candidate additions:

```text
Next Appointment
Progress Summary
Active Home Program
Pending Consent Action
```

### Therapist

Candidate additions:

```text
Today's Appointments
Upcoming Patients
Progress Requiring Review
Active Home Programs
```

### Super Admin

Candidate additions:

```text
Today's Appointment Count
Consent Policy Alert
System Notification Status
```

No vanity metric requirement.

## 15. Relationship Between New Resources

```text
PATIENT
   │
   ├── APPOINTMENT
   │      │
   │      └── optional link after completion
   │             ↓
   │        THERAPY SESSION
   │
   ├── ASSESSMENT
   │      ↓
   ├── TREATMENT PLAN
   │      │
   │      └── HOME PROGRAM
   │             └── EXERCISE ITEMS
   │
   ├── THERAPY SESSION
   │      ↓
   │   PROGRESS DATA
   │      ↓
   │   PROGRESS VIEW
   │
   └── CONSENT
```

Notification consumes events but is not the source of truth:

```text
Appointment changed
        ↓
Notification created
```

Appointment remains canonical source.

## 16. Execution Plan — GAP ONLY

> **DO NOT execute completed tasks again.**

AI Agent should run only:

```text
HF-GAP-001
Inspect existing code/schema for appointment/progress/home-program/consent
        ↓

HF-GAP-002
Implement Appointment / Scheduling P0
        ↓

HF-GAP-003
Implement Progress Aggregation P0
        ↓

HF-GAP-004
Implement Dedicated Home Exercise P0
        ↓

HF-GAP-005
Implement Consent Lifecycle P0
        ↓

HF-GAP-006
Cross-feature permission + audit + mobile QA
        ↓

HF-GAP-007
Implement Notification Center P1
```

Do not go back to:

```text
HF-TASK-000
HF-TASK-001
HF-TASK-002
...
```

unless human explicitly requests reopening an older completed feature.

## 17. Suggested AI Agent Prompt

```text
Read AGENTS.md and the existing canonical documentation first.

Then read:
docs/DASHBOARD-FEATURE-GAP-PRD.md

This file is a DELTA PATCH for an existing project.

Do NOT restart project bootstrap.
Do NOT rerun completed dashboard features.
Do NOT redesign Patient Management, Intake, Assessment,
Treatment Plan, Therapy Sessions, History, Roles, Permissions,
Audit, Security, or Landing Page.

Inspect the existing implementation before creating files.

Implement only the currently selected HF-GAP task.
Reuse existing code and schema wherever possible.
Use the current security architecture and permission system.
Mobile-first is mandatory.

Stop after the selected gap task passes its Definition of Done.
```

## 18. Global Definition of Done

Patch P0 is complete only when:

- [ ] existing completed features remain working;
- [ ] Appointment is implemented and secured;
- [ ] Patient Progress aggregates existing clinical data where possible;
- [ ] Home Exercise is a usable patient-visible resource;
- [ ] Consent lifecycle/version is auditable;
- [ ] new routes use server-side session + permission + ownership/scope checks;
- [ ] new DB queries are scoped;
- [ ] audit events exist for sensitive changes;
- [ ] mobile experience passes before desktop enhancement;
- [ ] lint passes;
- [ ] typecheck passes;
- [ ] relevant tests pass;
- [ ] no patient/secrets appear in logs;
- [ ] Notification Center remains optional P1 and does not block P0.

## 19. Final Scope Lock

The next dashboard development scope is:

```text
P0
├── Appointment / Scheduling
├── Patient Progress
├── Home Exercise Program
└── Consent Lifecycle

P1
└── Notification Center
```

Everything outside this list remains governed by the existing PRD and should **not be rebuilt as part of this patch**.
