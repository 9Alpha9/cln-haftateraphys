---
title: Hafta Fisioterapi Master PRD
version: 0.3.0
status: draft-for-validation
last_updated: 2026-08-12
---

# Hafta Fisioterapi — Master Product Requirements Document

## 1. Product summary

Hafta Fisioterapi membutuhkan satu aplikasi web yang menggabungkan:

1. public landing page;
2. authentication: register, login, logout, verification, password recovery;
3. patient portal;
4. staff/admin dashboard;
5. super-admin control panel;
6. patient intake dan clinical record workflow;
7. patient history;
8. access control dan auditability.

Aplikasi bukan sekadar company profile. Landing page menjadi acquisition layer, sedangkan dashboard menjadi operational patient-information system.

## 2. Product goals

### G-001 — Public trust

Menyediakan landing page yang menjelaskan Hafta, layanan, alur terapi, lokasi/kontak, therapist, edukasi, dan akses menuju patient portal.

### G-002 — Structured patient intake

Pasien dapat mendaftar dan mengisi data yang dibutuhkan dengan struktur konsisten sebelum/selama proses fisioterapi.

### G-003 — Therapist workflow

Staff/therapist yang berwenang dapat membuat assessment, treatment plan, session record, progress, dan patient history sesuai permission.

### G-004 — Patient transparency

Pasien dapat melihat data miliknya sendiri yang memang ditandai boleh terlihat oleh pasien.

### G-005 — Secure administration

Super Admin dapat mengelola akun, role/permission, configuration, dan audit tanpa otomatis mendapat akses klinis tanpa alasan.

### G-006 — Maintainability

Codebase harus modular, clean, typed, memiliki migration, authorization test, dan struktur folder yang konsisten.

## 3. Non-goals untuk v1

Tidak termasuk kecuali kemudian disetujui:

- telemedicine/video consultation;
- pembayaran online;
- insurance claim automation;
- public medical diagnosis automation;
- AI diagnosis;
- AI-generated treatment recommendation untuk pasien;
- automatic ingestion data pasien ke AI provider;
- complex inventory/pharmacy system;
- multi-branch enterprise architecture.

## 4. User roles

### R-001 — SUPER_ADMIN

Fokus pada administration, user management, role/permission, configuration, dan audit.

SUPER_ADMIN tidak otomatis mempunyai unrestricted clinical read access. Clinical access harus mengikuti permission eksplisit.

### R-002 — ADMIN

Role staff. Dapat memiliki sub-type seperti `THERAPIST` atau `STAFF` dan scoped permissions.

### R-003 — USER

Patient account. Hanya boleh mengakses data miliknya sendiri dan resource yang secara eksplisit patient-visible.

## 5. Public information architecture

### Route baseline

- `/`
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/verify-email`
- `/privacy`
- `/terms`

Optional future public routes:

- `/layanan/[slug]`
- `/edukasi`
- `/edukasi/[slug]`

## 6. Landing page requirements

### LP-001 — Header

Harus memiliki logo/brand, navigation, CTA konsultasi/contact, dan login portal.

### LP-002 — Hero

Harus menjelaskan value Hafta secara ringkas dan tidak membuat klaim medis berlebihan.

Recommended direction:

- positioning: fisioterapi + recovery + patient journey;
- primary CTA: konsultasi/contact;
- secondary CTA: patient portal.

### LP-003 — Services / conditions

Konten final harus menggunakan daftar layanan yang sudah dikonfirmasi client. Jangan mengubah posting edukasi Instagram menjadi klaim layanan resmi tanpa validasi.

### LP-004 — How therapy works

Section yang menjelaskan alur umum:

1. konsultasi/registrasi;
2. data awal;
3. assessment;
4. treatment plan;
5. session/progress;
6. evaluation/completion.

### LP-005 — About Hafta

Menggunakan cerita/positioning resmi dari client.

### LP-006 — Therapist section

Boleh berisi nama, foto, gelar/credential, dan fokus praktik hanya setelah data dikonfirmasi.

### LP-007 — Patient Portal value

Jelaskan manfaat portal tanpa menyatakan fitur yang belum live.

### LP-008 — Education

Boleh mengadaptasi tema edukasi publik dari Hafta setelah content approval.

### LP-009 — Testimonial/recovery story

Hanya gunakan materi pasien dengan consent publikasi yang dapat dibuktikan.

### LP-010 — FAQ

FAQ harus dikonfirmasi oleh operational owner.

### LP-011 — Location/contact

Alamat, nomor, jam operasional, dan channel booking harus dikonfirmasi sebelum production.

### LP-012 — Privacy footer

Link privacy policy dan terms wajib tersedia sebelum menerima data pasien production.

## 7. Authentication requirements

### AUTH-001 — Registration

USER dapat membuat akun menggunakan email/password.

Minimum fields:

- email;
- password;
- password confirmation;
- consent terhadap terms/privacy;
- optional display name jika dibutuhkan.

Patient medical data tidak dikumpulkan pada form register yang sama.

### AUTH-002 — Email verification

Email verification harus didukung sebelum user melakukan operasi sensitif.

### AUTH-003 — Login

Login menggunakan secure session cookie.

### AUTH-004 — Forgot/reset password

Reset token harus short-lived, single-use, dan tidak mengungkap apakah email tertentu terdaftar melalui response yang mudah dieksploitasi.

### AUTH-005 — Staff MFA

MFA sangat direkomendasikan dan menjadi target wajib sebelum production untuk ADMIN dan SUPER_ADMIN.

### AUTH-006 — Session management

Harus ada logout, session expiration, dan mekanisme revoke session untuk staff.

## 8. USER / patient portal

Baseline routes:

- `/dashboard`
- `/dashboard/profile`
- `/dashboard/intake`
- `/dashboard/history`
- `/dashboard/history/[recordId]` jika diperlukan
- `/dashboard/documents` jika feature upload diaktifkan
- `/dashboard/account/security`

### PT-001 — Patient profile

Patient dapat mengisi dan mengubah profile non-clinical sesuai policy.

### PT-002 — Patient intake

Form intake dipisah menjadi beberapa section agar manageable.

Candidate fields:

#### Identity/profile

- full name;
- date of birth;
- sex/gender field hanya jika benar-benar dibutuhkan workflow klinis dan sudah disetujui;
- phone;
- address general/detail sesuai kebutuhan minimum;
- occupation.

#### Emergency contact

- contact name;
- relationship;
- phone.

#### Main complaint

- chief complaint;
- affected area;
- onset date/time range;
- triggering event;
- pain/complaint scale bila digunakan Hafta;
- aggravating activity;
- relieving factors;
- functional limitations.

#### Relevant history

- injury history;
- surgery history;
- relevant medical history;
- medications;
- allergies;
- relevant examination/supporting document.

#### Goal

- patient goal;
- activity/sport goal.

#### Consent

- privacy/data-processing consent;
- clinical data submission acknowledgement;
- optional media/publication consent harus terpisah dan tidak bundled.

Final field list harus disetujui fisioterapis Hafta.

### PT-003 — Intake status

Status candidate:

- `DRAFT`
- `SUBMITTED`
- `UNDER_REVIEW`
- `NEEDS_REVISION`
- `ACCEPTED`

### PT-004 — Patient history

USER hanya dapat melihat record miliknya sendiri yang `patient_visible = true` dan sesuai lifecycle state.

### PT-005 — Patient cannot edit finalized clinical data

Assessment, clinical findings, finalized therapy sessions, dan therapist notes tidak dapat dimodifikasi oleh USER.

## 9. ADMIN / therapist dashboard

Baseline routes:

- `/dashboard`
- `/dashboard/patients`
- `/dashboard/patients/[patientId]`
- `/dashboard/patients/[patientId]/intake`
- `/dashboard/patients/[patientId]/assessment`
- `/dashboard/patients/[patientId]/treatment-plan`
- `/dashboard/patients/[patientId]/sessions`
- `/dashboard/patients/[patientId]/sessions/[sessionId]`
- `/dashboard/patients/[patientId]/history`
- `/dashboard/account/security`

### ADM-001 — Patient list

Admin hanya melihat patient sesuai assigned scope/permission.

Required capabilities:

- search;
- status filter;
- assigned therapist filter bila permitted;
- pagination;
- no sensitive data exposed unnecessarily in table.

### ADM-002 — Patient overview

Summary non-excessive:

- patient identity minimum;
- active complaint summary;
- intake status;
- assigned therapist;
- latest session;
- treatment status.

### ADM-003 — Assessment

Authorized therapist dapat membuat assessment.

Candidate sections:

- subjective assessment;
- objective findings;
- functional findings;
- clinical impression/working assessment according to Hafta workflow;
- measurable baseline;
- therapist notes;
- visibility status.

### ADM-004 — Treatment plan

Authorized therapist dapat membuat treatment plan terkait assessment.

Candidate fields:

- goals;
- planned interventions;
- expected review interval;
- home program;
- precautions;
- status.

### ADM-005 — Therapy sessions

Setiap session memiliki independent record.

Candidate fields:

- session datetime;
- therapist;
- pre-session state;
- interventions;
- response;
- measurements/progress;
- home program changes;
- next plan;
- draft/finalized status;
- patient visibility flag.

### ADM-006 — Finalization

Finalized clinical record tidak boleh di-hard-delete. Correction menggunakan revision/amendment mechanism.

### ADM-007 — Assignment

Patient dapat di-assign ke therapist sesuai permission.

### ADM-008 — Export

Export clinical data adalah privileged operation, default denied, dan wajib audit.

## 10. SUPER_ADMIN dashboard

Routes candidate:

- `/dashboard/users`
- `/dashboard/users/[userId]`
- `/dashboard/staff`
- `/dashboard/roles`
- `/dashboard/audit-logs`
- `/dashboard/settings`

### SA-001 — Account management

Manage account state:

- active;
- suspended;
- disabled;
- invited;
- verification status.

### SA-002 — Role assignment

Role changes wajib audit.

### SA-003 — Permission management

Permission assignment tidak boleh dapat diedit oleh ADMIN biasa.

### SA-004 — Audit viewer

Audit log hanya read-only dari UI normal.

### SA-005 — Clinical access

Super Admin tidak otomatis mempunyai clinical read permission.

## 11. Status model

### Patient case status candidate

- `INTAKE`
- `ACTIVE`
- `ON_HOLD`
- `COMPLETED`
- `REFERRED`
- `ARCHIVED`

Final terminology harus divalidasi bersama Hafta.

### Clinical document state

- `DRAFT`
- `FINALIZED`
- `AMENDED`
- `ARCHIVED`

## 12. Search and filtering

Search harus server-side untuk dataset yang dapat berkembang.

Jangan expose full dataset ke client hanya untuk filtering.

## 13. Audit requirements

Audit minimum:

- login success/failure aggregate dengan privacy-aware logging;
- logout/revoke;
- role change;
- permission change;
- patient record view untuk sensitive clinical views jika feasible;
- patient create/update;
- assessment create/finalize/amend;
- treatment plan create/update/finalize;
- session create/finalize/amend;
- document upload/download/delete/archive;
- data export;
- account suspension/reactivation.

## 14. Notification baseline

V1 boleh hanya menggunakan in-app state tanpa complex notification engine. Email verification/reset tetap memerlukan transactional email provider.

Future notification dapat ditambahkan melalui requirement terpisah.

## 15. Accessibility requirements

- Keyboard accessible.
- Visible focus.
- Semantic labels.
- Form errors terasosiasi ke field.
- Kontras layak.
- Jangan menggunakan warna sebagai satu-satunya status indicator.
- Respect reduced motion.

## 16. Responsive requirements — MOBILE FIRST

Canonical rule: `docs/MOBILE-FIRST-STRATEGY.md`.

- Semua UI dibangun dari base/mobile layout terlebih dahulu.
- AI agent tidak boleh memulai dari desktop lalu mengecilkan layout ke mobile.
- Mobile validation minimum: 320, 360, 390, dan 430px.
- Tablet enhancement setelah Mobile Gate: 768/834px.
- Desktop enhancement hanya setelah Mobile Gate lulus; validate 1024/1280/1440px.
- Landing page, auth, Patient Portal, ADMIN/Therapist, dan SUPER_ADMIN mengikuti urutan ini.
- Forms mobile single-column by default.
- Tables besar harus memiliki mobile strategy: compact card/list, priority columns, contained horizontal scroll, atau detail drill-down.
- Tidak boleh ada body-level horizontal overflow.
- Desktop boleh meningkatkan density/composition tetapi tidak boleh mengubah hierarchy inti atau menambahkan hover-only operation.
- Mobile Gate + Desktop Gate + cross-breakpoint QA adalah Definition of Done untuk UI.

## 17. Performance requirements

- Gunakan Server Components secara default jika tidak membutuhkan interactivity client.
- Client Component hanya ketika diperlukan.
- Pagination untuk large lists.
- Hindari over-fetching.
- Optimize images.
- Jangan mengirim clinical payload yang tidak sedang dilihat user.

## 18. Data retention/deletion

Data retention klinis tidak boleh ditentukan oleh coding agent. Policy final harus mengikuti kebutuhan Hafta dan kewajiban hukum/rekam medis yang berlaku.

Account deletion oleh patient tidak otomatis berarti hard-delete seluruh clinical record.

## 19. Privacy requirements

- Data minimization.
- Purpose limitation.
- Explicit consent where required.
- Separate public-media consent dari service/clinical consent.
- Access based on need-to-know.
- No patient data in AI development prompts.

## 20. Analytics

Public landing analytics boleh digunakan setelah privacy review.

Jangan kirim clinical page content, patient identifiers, complaint text, diagnosis, atau document names ke third-party analytics.

## 21. Acceptance criteria v1

V1 dianggap layak staging jika:

- public landing page complete dengan validated content placeholders;
- register/login/verification/reset bekerja;
- USER dapat mengisi intake;
- ADMIN yang permitted dapat melihat assigned patient dan membuat clinical records;
- USER tidak dapat melihat patient lain;
- ADMIN tanpa permission tidak dapat membuka resource melalui direct URL/API/action;
- SUPER_ADMIN dapat mengelola akun/permission dan audit;
- clinical hard delete tidak tersedia;
- security tests kritis lulus;
- audit log untuk sensitive mutations bekerja;
- secrets tidak bocor ke client/log/repository;
- production patient data tidak pernah dikirim ke AI agent.

## 22. Detailed implementation specifications

Master PRD ini menentukan kebijakan produk utama. Implementasi halaman harus membaca spesifikasi detail berikut:

- `docs/DESIGN-REFERENCES.md` — original inspiration, approved Hafta mockup, dan reference precedence.
- `docs/DESIGN-SYSTEM.md` — palette, typography, spacing, components, states, accessibility.
- `docs/MOBILE-FIRST-STRATEGY.md` — responsive implementation order dan QA gates.
- `docs/pages/01-LANDING-PAGE.md` — landing page, section, CTA, content state, SEO, responsive, acceptance criteria.
- `docs/pages/02-AUTHENTICATION-PAGES.md` — login, register, verification, forgot/reset password, auth UX dan security states.
- `docs/pages/03-DASHBOARD-USER.md` — Patient Portal USER, own-data scope, intake, history, documents, security.
- `docs/pages/04-DASHBOARD-ADMIN-THERAPIST.md` — patient list, intake review, assessment, treatment plan, sessions, finalization/amendment.
- `docs/pages/05-DASHBOARD-SUPER-ADMIN.md` — account, staff, role/permission, audit, settings, clinical-access gate.
- `docs/FORM-SPECIFICATIONS.md` — candidate field contract dan form lifecycle.
- `docs/ROUTE-AND-NAVIGATION.md` — route/access matrix.

Jika detail page spec membutuhkan perubahan terhadap product policy di Master PRD, update Master PRD terlebih dahulu. Security, permissions, dan database integrity tidak boleh diturunkan oleh page spec.
