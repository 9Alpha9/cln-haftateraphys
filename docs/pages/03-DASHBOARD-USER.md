---
title: Hafta Fisioterapi USER Patient Portal Specification
version: 0.3.0
status: implementation-ready-with-clinical-field-validation-pending
last_updated: 2026-08-12
source_of_truth_for:
  - user-dashboard
  - patient-portal
  - patient-self-service
---

# USER / Patient Portal Specification

> **UI implementation contract:** read `docs/DESIGN-REFERENCES.md`, `docs/DESIGN-SYSTEM.md`, and `docs/MOBILE-FIRST-STRATEGY.md`. Build and pass the mobile version first; desktop enhancement is not allowed before Mobile Gate passes.

## 1. Role

`USER` represents patient account in v1.

Core principle:

```text
USER may access own patient resources only.
```

No client-side identity value is trusted for ownership checks.

## 2. Information architecture

Baseline:

```text
/dashboard
/dashboard/profile
/dashboard/intake
/dashboard/history
/dashboard/history/[recordId]     optional based on record model
/dashboard/documents              if enabled
/dashboard/account/security
```

### Navigation labels

- Ringkasan
- Data Saya
- Form Awal / Intake
- Riwayat Terapi
- Dokumen [feature-gated]
- Keamanan Akun

Avoid clinical admin labels that confuse patients.

## 3. USER dashboard home

### Route

```text
/dashboard
```

### Primary goals

- show next required action;
- show intake status;
- show simple case/recovery status when patient-visible;
- show recent visible history;
- surface account/security issue;
- avoid exposing therapist-private notes.

### Recommended modules

#### A. Welcome / context

```text
Halo, {firstName}
```

No sensitive complaint in greeting.

#### B. Next action card

Priority-driven:

```text
if profile incomplete -> Lengkapi Data Saya
else if intake draft -> Lanjutkan Form Awal
else if intake needs revision -> Perbaiki Form Awal
else if intake submitted -> Menunggu review
else -> show recent patient-visible status
```

#### B2. Direct therapy booking

The patient dashboard is intentionally limited to three blocks:

1. a short greeting header;
2. the therapy schedule block;
3. the medical record and evaluation block.

There is no monthly calendar, intake banner, or statistics hub on the patient
home page. The monthly calendar lives only on `/dashboard/appointments`.

Schedule block behaviour:

- **No active appointment and no pending request** (or the patient pressed
  `Ubah Jadwal`): show `PatientBookingPanel` directly on the dashboard;
- **Pending request or active appointment**: show the therapy schedule card
  instead of the form.

Booking order is always:

1. pick a therapist;
2. pick an available date for that therapist;
3. pick an available time slot;
4. submit `Ajukan Jadwal Terapi` (or `Ajukan Perubahan Jadwal` in reschedule
   mode).

Rules:

- availability is fetched server-side from active therapist schedules;
- full dates and full time slots are rendered in red, disabled, and explained
  briefly to the patient;
- the date strip can be scrolled horizontally with visible previous/next
  controls;
- a newly registered patient is signed in automatically, gets a `patients`
  profile with `caseStatus: ACTIVE` and an auto-generated medical record
  number, and may book before completing intake;
- the patient is never instructed to contact the clinic merely to create a
  first booking; an empty availability state offers a reload action instead;
- validation and authorization remain server-side;
- a pending new booking is labelled "Jadwal terapi baru", never "Sesi
  tambahan";
- the schedule card footer uses the primary action on the left (`Ubah Jadwal`)
  and the secondary action on the right (`Lihat Detail`);
- `Ubah Jadwal` is locked with the message "Menunggu ACC Terapis" while a
  request is pending;
- `Lihat Detail` opens a centred modal with the full schedule and a
  `Batalkan Pengajuan` action for pending requests;
- the medical record block shows patient-visible evaluation cards or a clean
  empty state, with a link to all medical records.

#### C. Intake status

Status:

- Draft
- Submitted
- Under Review
- Needs Revision
- Accepted

#### D. Recent history

Show only patient-visible records.

#### E. Assigned therapist

Only if assignment and therapist profile are patient-visible.

#### F. Privacy note

Short reminder that portal contains personal/health information; logout on shared devices.

### Avoid

- fake KPI cards;
- “total recovery %” unless clinically defined and approved;
- exposing raw clinical measurements without context;
- generic SaaS charts just for decoration.

## 4. Patient profile

### Route

```text
/dashboard/profile
```

### Editable candidate fields

- full name;
- preferred display name optional;
- date of birth;
- phone;
- general address/detail based on minimum operational need;
- occupation;
- emergency contact.

Email/account identifier should follow auth account update flow, not ordinary profile mutation if verification is required.

### Ownership

Server resolves patient profile from authenticated user ID. Do not accept arbitrary `patientId` from USER mutation without ownership verification.

### UI

- sectioned form;
- saved state;
- validation errors;
- clear distinction account email vs patient profile;
- sensitive values not echoed in toast/log.

## 5. Patient intake

### Route

```text
/dashboard/intake
```

### Goal

Collect structured patient-submitted information before clinical assessment.

### Form architecture

Recommended step groups:

1. Profil & Kontak
2. Keluhan Utama
3. Aktivitas & Keterbatasan
4. Riwayat Relevan
5. Dokumen Pendukung [optional]
6. Target Pasien
7. Persetujuan & Review

### Draft behavior

Allowed states:

```text
DRAFT -> SUBMITTED
NEEDS_REVISION -> SUBMITTED
```

USER may update only editable draft/revision state.

### Submission confirmation

Before submit, explain:

- data akan dikirim ke tim Hafta untuk review;
- clinical assessment tetap dilakukan oleh tenaga berwenang;
- patient can no longer freely edit submitted fields unless revision is requested, according to final product rule.

### Autosave

Optional, not mandatory. If implemented:

- reliable;
- explicit saved indicator;
- server-side ownership and validation;
- do not save partial upload without cleanup strategy;
- handle offline/network failure clearly.

## 6. History

### Route

```text
/dashboard/history
```

### Purpose

Allow patient to review selected finalized records from their own journey.

### Possible visible types

- intake submission summary;
- assessment summary if `patient_visible`;
- treatment plan summary if `patient_visible`;
- finalized therapy session summary if `patient_visible`;
- progress note subset if approved;
- home program if approved;
- completion summary.

### Rules

Patient-visible DTO must be separate from internal clinical DTO.

Never expose automatically:

- internal-only therapist notes;
- audit logs;
- internal risk flags;
- other patient identifiers;
- permission metadata;
- raw database IDs if not needed.

### History list UI

Each item can show:

- date;
- record type;
- status;
- therapist display name if allowed;
- short patient-safe summary;
- detail action.

### Empty state

```text
Belum ada riwayat yang dapat ditampilkan.
```

Do not imply no clinical data exists internally.

## 7. Documents

Feature-gated route:

```text
/dashboard/documents
```

### Allowed user actions candidate

- upload supporting document to own case, if enabled;
- view own document metadata;
- download own permitted document;
- archive/remove own unsubmitted document if policy allows.

### Upload restrictions

- allowed MIME allowlist;
- size limit;
- filename sanitization;
- malware/security review strategy before production;
- private R2 bucket;
- signed access after authorization;
- storage key must not expose patient name.

## 8. Account security

### Route

```text
/dashboard/account/security
```

### Functions

- change password through auth provider;
- view/revoke sessions if supported;
- email verification status;
- optional MFA if USER feature enabled later;
- logout all sessions if available.

Do not expose sensitive security metadata unnecessarily.

## 9. Patient-facing status vocabulary

Prefer clear Indonesian labels:

```text
DRAFT -> Belum selesai
SUBMITTED -> Sudah dikirim
UNDER_REVIEW -> Sedang ditinjau
NEEDS_REVISION -> Perlu diperbarui
ACCEPTED -> Sudah ditinjau
```

Internal terminology may remain enums. UI copy should be patient-friendly.

## 10. Authorization requirements

For every USER resource:

```text
authenticated
AND role == USER
AND resource.patient.userId == session.user.id
AND patient_visible if clinical record
AND state allows requested action
```

### Mandatory attack tests

- USER A requests USER B ID;
- USER changes URL to another record ID;
- USER sends another patientId in form body;
- USER tries finalize assessment endpoint;
- USER tries document signed URL for other patient;
- USER modifies `patient_visible` payload;
- USER attempts mass assignment of role/permission fields.

All must fail safely.

## 11. Loading/empty/error states

Must define:

- initial dashboard loading;
- profile unavailable;
- intake draft missing/create state;
- no history;
- forbidden resource;
- expired session;
- record changed/finalized while open;
- upload failure;
- server failure.

No raw stack traces or database error messages.

## 12. Responsive UX

Mobile is first-class for USER portal.

- navigation sheet/bottom-safe menu pattern;
- forms single-column;
- sticky save/continue allowed if accessible;
- history cards preferred over very wide table;
- large tap targets;
- progress stepper scroll-safe or compact;
- no horizontal clinical table dependency.

## 13. Patient portal component candidates

```text
components/patient/
├── dashboard/
│   ├── PatientWelcome.tsx
│   ├── PatientNextAction.tsx
│   ├── IntakeStatusCard.tsx
│   └── RecentPatientHistory.tsx
├── profile/
│   └── PatientProfileForm.tsx
├── intake/
│   ├── PatientIntakeForm.tsx
│   ├── IntakeStepNavigation.tsx
│   ├── MainComplaintFields.tsx
│   ├── HistoryFields.tsx
│   └── IntakeReview.tsx
├── history/
│   ├── PatientHistoryList.tsx
│   └── PatientHistoryDetail.tsx
└── documents/
    └── PatientDocumentUploader.tsx
```

Do not split every field into separate component without reuse/value.

## 14. Acceptance criteria

- [ ] USER only sees own patient data;
- [ ] clinical record requires patient-visible rule;
- [ ] profile/intake mutations perform server ownership check;
- [ ] intake supports draft/submission lifecycle;
- [ ] finalized clinical record cannot be edited by USER;
- [ ] history uses patient-safe DTO;
- [ ] no internal note leakage;
- [ ] responsive mobile portal usable;
- [ ] account security page works with auth provider;
- [ ] all sensitive error states are safe;
- [ ] authorization tests pass.


## Implementation notes — Intake consent (2026-11-06)

- Form Awal memiliki dua persetujuan terpisah:
  - persetujuan pemrosesan data pasien (wajib saat submit, tautan ke Kebijakan Privasi dan Syarat & Ketentuan);
  - persetujuan publikasi media (opsional, tidak dibundel dengan persetujuan layanan).
- Draft dapat disimpan tanpa persetujuan privasi; submit ditolak sampai persetujuan diberikan.
- Waktu persetujuan disimpan pada `privacy_consent_at`.
- Reviewer intake dapat melihat status persetujuan pada tab/grup **Persetujuan Pasien**.
