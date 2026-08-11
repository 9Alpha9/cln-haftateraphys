---
title: Hafta Fisioterapi Application Architecture
version: 0.1.0
last_updated: 2026-08-12
---

# Architecture

## 1. Architecture principle

Gunakan modular monolith Next.js. Satu repository dan satu deployable application pada v1, dengan boundary domain yang tegas.

Tidak perlu microservices untuk MVP.

## 2. Runtime direction

Current verified direction saat dokumen dibuat:

- Next.js latest stable menggunakan App Router.
- Gunakan Node runtime untuk server feature yang memerlukan package Node compatibility.
- Database: Neon PostgreSQL.
- ORM: Drizzle.

Jangan hardcode nomor versi di code-generation prompt. Gunakan lockfile repository sebagai source of truth setelah project diinisialisasi.

## 3. Logical layers

```text
Browser
  |
  v
Next.js App Router
  |
  +-- Route / Page Composition
  +-- Server Actions / Route Handlers
  |
  v
Authentication + Authorization
  |
  v
Domain Services
  |
  +-- Validation
  +-- Business Rules
  +-- Audit Events
  |
  v
Repository / Drizzle Queries
  |
  v
Neon PostgreSQL

Private documents:
Next.js -> authorization -> signed storage access -> Cloudflare R2
```

## 4. Recommended repository structure

```text
/
├── AGENTS.md
├── README-AI.md
├── manifest.json
├── docs/
│   ├── MASTER-PRD.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── PERMISSIONS.md
│   ├── SECURITY.md
│   ├── UI-GUIDELINES.md
│   ├── DEVELOPMENT-WORKFLOW.md
│   └── CONTENT-REQUIREMENTS.md
│
├── app/
│   ├── (public)/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── profile/page.tsx
│   │   ├── intake/page.tsx
│   │   ├── history/page.tsx
│   │   ├── patients/
│   │   │   ├── page.tsx
│   │   │   └── [patientId]/
│   │   │       ├── page.tsx
│   │   │       ├── intake/page.tsx
│   │   │       ├── assessment/page.tsx
│   │   │       ├── treatment-plan/page.tsx
│   │   │       ├── sessions/page.tsx
│   │   │       ├── sessions/[sessionId]/page.tsx
│   │   │       └── history/page.tsx
│   │   ├── users/page.tsx
│   │   ├── staff/page.tsx
│   │   ├── roles/page.tsx
│   │   ├── audit-logs/page.tsx
│   │   └── settings/page.tsx
│   └── api/
│       └── auth/[...all]/route.ts
│
├── components/
│   ├── ui/
│   ├── landing/
│   │   ├── hero/
│   │   ├── services/
│   │   ├── process/
│   │   ├── about/
│   │   ├── therapists/
│   │   ├── portal/
│   │   ├── faq/
│   │   └── contact/
│   ├── auth/
│   ├── dashboard/
│   └── patient/
│
├── db/
│   ├── index.ts
│   ├── schema/
│   │   ├── auth.ts
│   │   ├── profiles.ts
│   │   ├── patients.ts
│   │   ├── assignments.ts
│   │   ├── intakes.ts
│   │   ├── assessments.ts
│   │   ├── treatment-plans.ts
│   │   ├── sessions.ts
│   │   ├── documents.ts
│   │   ├── consents.ts
│   │   └── audit-logs.ts
│   ├── migrations/
│   └── seed/
│
├── server/
│   ├── actions/
│   ├── queries/
│   ├── services/
│   └── repositories/
│
├── lib/
│   ├── auth/
│   ├── permissions/
│   ├── validators/
│   ├── security/
│   ├── constants/
│   └── utils/
│
├── hooks/
├── types/
├── config/
├── public/
└── tests/
    ├── unit/
    ├── integration/
    └── authorization/
```

## 5. Component boundary

### `app/`
Route composition, layout, metadata, route handlers, server entry points.

### `components/`
UI. Presentational component tidak melakukan privileged database operation.

### `server/actions/`
Mutation entry point. Selalu re-check session, input validation, authorization, domain rule.

### `server/queries/`
Read operations dengan scoped authorization.

### `server/services/`
Business workflow seperti finalize assessment, assign therapist, amend session.

### `server/repositories/`
Database access abstraction untuk query yang kompleks/reused.

### `db/`
Schema, connection, migrations, seed.

### `lib/permissions/`
Permission constants, policy evaluation, resource scope checks.

## 6. Server-first rule

Default gunakan Server Components.

Gunakan Client Component hanya untuk:

- local interaction state;
- complex controlled inputs;
- browser-only APIs;
- interactive charts/widgets;
- shadcn primitives yang memerlukan client behavior.

Jangan menandai entire dashboard sebagai `use client` hanya karena beberapa komponen interaktif.

## 7. Data flow pattern

Example mutation:

```text
UI submit
 -> Server Action
 -> parse Zod schema
 -> require authenticated session
 -> authorize(action, resource)
 -> domain service
 -> transaction
 -> database write
 -> audit write
 -> revalidate affected route/tag
 -> safe response
```

## 8. Error model

Gunakan typed domain errors, misalnya:

- `UnauthenticatedError`
- `ForbiddenError`
- `ValidationError`
- `ConflictError`
- `NotFoundError`
- `RecordFinalizedError`

Jangan mengirim stack trace internal ke client production.

## 9. ID strategy

Gunakan non-sequential public identifiers seperti UUID/ULID yang didukung stack.

Tetap lakukan authorization. Unpredictable ID bukan access control.

## 10. 9Router architecture boundary

```text
Coding Agent
   |
   v
9Router local gateway
   |
   +-- configured model/provider A
   +-- configured model/provider B
   +-- fallback provider
   |
   v
Local source code / repository
```

9Router tidak ditempatkan dalam:

```text
Patient browser -> production app -> database
```

Tidak ada patient runtime request yang membutuhkan 9Router.

## 11. Dependency rule

UI may depend on domain types/contracts.
Domain service may depend on repositories.
Repositories may depend on Drizzle/db.

Database layer tidak boleh mengimpor UI.
Permission/security layer tidak boleh tergantung pada page component.

## 12. Architecture decision records

Untuk perubahan besar buat `docs/adr/NNNN-title.md` dengan:

- context;
- decision;
- alternatives;
- security impact;
- migration impact;
- consequences.
