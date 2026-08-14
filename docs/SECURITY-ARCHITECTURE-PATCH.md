---
title: Hafta Fisioterapi — Current Portal Security Architecture Patch
version: 0.3.1-security-patch
status: current-architecture-decision
last_updated: 2026-08-14
scope:
  - current-single-nextjs-project
  - dashboard-access-boundary
  - public-vs-portal-host-separation
  - server-side-authentication
  - server-side-authorization
  - object-level-access
  - database-query-scoping
non_goals:
  - rebuild-project-from-zero
  - migrate-to-monorepo-now
  - redesign-landing-page
  - redesign-database-from-zero
  - replace-existing-auth-stack
---

# Hafta Fisioterapi — Current Portal Security Architecture Patch

> **Purpose:** dokumen ini hanya mengatur masalah arsitektur/security yang sedang dibahas sekarang. Ini **bukan PRD baru** dan **bukan instruksi untuk membangun ulang project dari awal**.
>
> AI Agent wajib mempertahankan struktur, komponen, database, auth integration, dan feature yang sudah ada kecuali perubahan kecil diperlukan untuk menerapkan security boundary di dokumen ini.

## 1. Problem yang sedang diselesaikan

Project saat ini berada dalam satu aplikasi Next.js dengan landing page publik dan dashboard pada codebase yang sama.

Masalah yang harus diselesaikan:

1. `/dashboard` tidak boleh dianggap aman hanya karena link-nya disembunyikan.
2. Public landing domain tidak perlu mengekspos route dashboard.
3. Guest tidak boleh menerima dashboard content atau protected data.
4. User yang sudah login tetap tidak boleh otomatis mengakses seluruh dashboard route.
5. USER hanya boleh mengakses resource miliknya sendiri.
6. Therapist/Admin hanya boleh mengakses patient/resource sesuai permission dan assignment/scope.
7. SUPER_ADMIN tidak otomatis mendapat unrestricted clinical access.
8. Security tidak boleh bergantung pada UI, sidebar, client state, atau route secrecy.

## 2. Keputusan arsitektur saat ini

**Jangan migrasi project ke monorepo atau dua aplikasi terpisah pada tahap ini.**

Pertahankan codebase saat ini dan gunakan:

```text
CURRENT NEXT.JS PROJECT
        │
        ├── PUBLIC LANDING AREA
        │
        └── PROTECTED DASHBOARD AREA
```

Target production host:

```text
www.<domain>
    └── public landing only

portal.<domain>
    └── authentication + protected dashboard
```

Expected behavior:

```text
www.<domain>/dashboard
        ↓
       404
```

sedangkan:

```text
portal.<domain>/dashboard
        ↓
server-side authentication
        ↓
server-side authorization
        ↓
allowed dashboard content
```

**URL bukan security secret.** Mengetahui route portal tidak memberi hak akses apa pun.

## 3. Pertahankan struktur project yang ada

Tidak perlu memindahkan project menjadi `apps/web` dan `apps/portal` sekarang.

Pertahankan pola existing:

```text
app/
├── (public)/
├── api/auth/[...all]/
├── dashboard/
│   ├── audit-logs/
│   ├── history/
│   ├── intake/
│   ├── patients/
│   ├── profile/
│   ├── roles/
│   ├── security/
│   ├── settings/
│   ├── staff/
│   ├── users/
│   ├── layout.tsx
│   └── page.tsx
├── layanan/
├── privacy/
├── tentang/
└── terms/

components/
├── auth/
├── dashboard/
├── landing/
├── patient/
└── ui/

lib/
├── auth/
├── permissions/
├── security/
└── validators/

server/
db/
```

Tambahkan hanya security-specific pieces yang memang dibutuhkan.

Recommended additions:

```text
middleware.ts

lib/auth/
└── require-session.ts

lib/permissions/
├── permissions.ts
├── require-permission.ts
└── resource-access.ts

lib/security/
├── authorization.ts
├── audit.ts
└── rate-limit.ts
```

Nama file boleh menyesuaikan existing code. **Jangan membuat duplicate abstraction.**

## 4. Security boundary berlapis

```text
REQUEST
   │
   ▼
[1] HOST / ROUTE GATE
    root middleware.ts
   │
   ▼
[2] AUTHENTICATION GATE
    verified server session
   │
   ▼
[3] AUTHORIZATION GATE
    role + permission
   │
   ▼
[4] RESOURCE ACCESS GATE
    ownership / assignment / scope
   │
   ▼
[5] DATABASE QUERY SCOPE
    fetch only allowed records
   │
   ▼
[6] AUDIT + SAFE RESPONSE
```

Tidak ada satu layer yang menggantikan layer lain.

## 5. Layer 1 — root `middleware.ts`

Tambahkan `middleware.ts` di root project sebagai **first request gate**, bukan satu-satunya authorization system.

Responsibilities:

- membaca hostname;
- membedakan public host dan portal host;
- menolak `/dashboard*` pada public host;
- menjaga localhost development tetap workable;
- tidak menaruh business authorization kompleks di proxy.

Expected behavior:

```text
www.<domain>/                 → allow
www.<domain>/layanan         → allow
www.<domain>/dashboard       → 404
www.<domain>/dashboard/*     → 404
portal.<domain>/dashboard    → continue to server auth guard
localhost:<port>/dashboard   → allowed for development
```

Conceptual pattern:

```ts
// middleware.ts — adapt to actual environment
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  const pathname = request.nextUrl.pathname;

  const publicHost = process.env.PUBLIC_APP_HOST ?? '';
  const isPublicHost = host === publicHost || host === `www.${publicHost}`;

  if (isPublicHost && pathname.startsWith('/dashboard')) {
    return new NextResponse('Not Found', { status: 404 });
  }

  return NextResponse.next();
}
```

AI Agent MUST adapt, not copy blindly.

## 6. Layer 2 — server-side dashboard session guard

`app/dashboard/layout.tsx` harus menjadi dashboard-level authentication gate.

```text
REQUEST /dashboard/*
        ↓
verify server session
        │
        ├── invalid / missing
        │      ↓
        │   login / unauthorized flow
        │
        └── valid
               ↓
          protected dashboard shell
```

Rules:

- session check wajib server-side;
- gunakan existing Better Auth integration;
- jangan percaya `localStorage`;
- jangan percaya query param;
- jangan percaya role dari client component;
- dashboard layout hanya memastikan authenticated, bukan semua child route boleh diakses.

## 7. Layer 3 — permission guard per protected feature

Authenticated user tidak otomatis boleh mengakses seluruh dashboard.

Baseline:

```text
USER
  - own profile
  - own intake
  - own patient-visible history
  - own account security

ADMIN / THERAPIST
  - assigned/scoped patients
  - approved clinical actions
  - own account security

SUPER_ADMIN
  - user/staff/role/system administration
  - audit access
  - clinical access only when explicitly permitted
```

Sensitive routes seperti:

```text
/dashboard/users
/dashboard/staff
/dashboard/roles
/dashboard/audit-logs
/dashboard/settings
/dashboard/patients
```

harus memiliki server-side permission check.

UI hiding seperti:

```tsx
{
  role === 'SUPER_ADMIN' && <UsersMenu />;
}
```

hanya UX, bukan security.

## 8. Layer 4 — object-level / resource authorization

Permission seperti `patient:read` belum cukup.

### USER

```text
session.user.id = user_A
patient.userId = user_A
        ↓
ALLOW
```

```text
session.user.id = user_A
patient.userId = user_B
        ↓
DENY
```

### Therapist

```text
therapist_A
  assigned → patient_001
  assigned → patient_002
```

```text
patient_001 → ALLOW
patient_002 → ALLOW
patient_900 → DENY
```

Minimum checks:

```text
USER:
role + ownership + patient-visible state

THERAPIST:
role + permission + assignment/scope + record state

SUPER_ADMIN:
role + system permission
clinical data still requires explicit clinical permission/scope
```

## 9. Layer 5 — database query scope

Forbidden:

```text
DB → all patients → React/client filter
```

Required:

```text
session
   ↓
permission
   ↓
resource scope
   ↓
DATABASE WHERE / JOIN scope
   ↓
only allowed rows
```

Examples:

```text
USER:
patients WHERE user_id = current_user_id

THERAPIST:
patients JOIN patient_assignments
WHERE therapist_id = current_staff_id
```

Exact Drizzle implementation must follow existing schema/service pattern.

## 10. Server Actions / Route Handlers / Services

`app/dashboard/layout.tsx` tidak cukup untuk melindungi mutation atau direct server call.

Required flow:

```text
Server Action / Route Handler
        ↓
requireSession()
        ↓
requirePermission()
        ↓
validate input
        ↓
check resource access
        ↓
service / transaction
        ↓
audit event
```

Jika `app/dashboard/actions.ts` sudah ada, refactor boleh incremental saat file disentuh. Jangan bongkar seluruh action layer hanya karena patch ini.

## 11. Host architecture

```text
                 INTERNET
                    │
          ┌─────────┴─────────┐
          │                   │
          ▼                   ▼

   www.<domain>         portal.<domain>
          │                   │
     PUBLIC AREA          PRIVATE AREA
          │                   │
     landing page          authentication
     layanan              dashboard
     tentang              protected resources
     privacy              admin tools
     terms                patient portal
```

Current phase:

```text
ONE NEXT.JS CODEBASE
ONE REPOSITORY
HOST-AWARE ROUTING
SERVER AUTHORIZATION
```

Future two-app isolation is out of scope for this patch.

## 12. Session / secret boundary

Preferred production behavior:

```text
www.<domain>
  → no dashboard session dependency

portal.<domain>
  → auth/session cookie used here
```

Avoid broad cross-subdomain session sharing unless a real feature requires it.

Never expose to client:

```text
session token
Better Auth secret
DATABASE_URL
R2 secret keys
SMTP password
```

## 13. Current route access baseline

| Current route           | USER                  | ADMIN / THERAPIST                  | SUPER_ADMIN                      |
| ----------------------- | --------------------- | ---------------------------------- | -------------------------------- |
| `/dashboard`            | allowed               | allowed                            | allowed                          |
| `/dashboard/profile`    | own only              | own only                           | own only                         |
| `/dashboard/intake`     | own                   | scoped/review                      | scoped                           |
| `/dashboard/history`    | own + patient-visible | assigned/scoped                    | explicit clinical scope          |
| `/dashboard/patients`   | deny by default       | assigned/scoped                    | permission required              |
| `/dashboard/staff`      | deny                  | limited if granted                 | permission required              |
| `/dashboard/users`      | deny                  | deny/limited if explicitly granted | permission required              |
| `/dashboard/roles`      | deny                  | deny                               | permission required              |
| `/dashboard/audit-logs` | deny                  | deny unless explicitly granted     | permission required              |
| `/dashboard/security`   | own account           | own account                        | own + authorized system security |
| `/dashboard/settings`   | own/account-specific  | limited                            | system permission required       |

If this table conflicts with `docs/PERMISSIONS.md`, use the more restrictive rule until intentionally resolved.

## 14. Public-domain dashboard behavior

After host separation is enabled:

```text
www.<domain>/dashboard
www.<domain>/dashboard/*
```

MUST NOT render dashboard shell or sensitive route details.

Expected result:

```text
404 / not found
```

Portal remains:

```text
portal.<domain>/dashboard
```

Local development may continue using:

```text
localhost:<port>/dashboard
```

## 15. Optional operational kill switch

Only if needed later:

```env
PORTAL_ENABLED=true
PORTAL_MAINTENANCE_MODE=false
```

This is an operational control, **not authorization**. Do not implement before core session/permission/resource checks unless deployment requires it.

## 16. Required security tests

### Authentication

- [ ] guest cannot access dashboard content;
- [ ] expired/invalid session cannot access dashboard;
- [ ] authenticated user can reach permitted dashboard entry.

### Public host isolation

- [ ] public host `/dashboard` returns not-found behavior;
- [ ] public host `/dashboard/*` returns not-found behavior;
- [ ] public landing routes remain available;
- [ ] localhost development is not accidentally blocked.

### Vertical authorization

- [ ] USER cannot open `/dashboard/users`;
- [ ] USER cannot open `/dashboard/roles`;
- [ ] ADMIN cannot use SUPER_ADMIN-only permission without grant.

### Horizontal authorization

- [ ] USER A cannot access USER B patient/history resource;
- [ ] Therapist A cannot access unassigned patient without explicit scope;
- [ ] changing URL/resource ID does not bypass access checks.

### Server boundary

- [ ] direct Server Action calls repeat auth checks;
- [ ] direct Route Handler calls repeat auth checks;
- [ ] DB queries return scoped records only.

## 17. Implementation order — current problem only

**Do not restart project tasks from bootstrap.**

Execute only this delta:

```text
SEC-ARCH-01
Inspect current auth / permission implementation
        ↓
SEC-ARCH-02
Add root host-aware middleware.ts
        ↓
SEC-ARCH-03
Harden app/dashboard/layout.tsx session gate
        ↓
SEC-ARCH-04
Centralize requireSession / requirePermission using existing code
        ↓
SEC-ARCH-05
Apply permission checks to sensitive current routes
        ↓
SEC-ARCH-06
Apply ownership / assignment checks to patient resources
        ↓
SEC-ARCH-07
Scope database queries
        ↓
SEC-ARCH-08
Protect current Server Actions / Route Handlers
        ↓
SEC-ARCH-09
Add authorization and host-isolation tests
        ↓
SEC-ARCH-10
Configure www vs portal host in deployment environment
```

No landing-page redesign is part of this task.

No database redesign is part of this task unless secure ownership/assignment scoping is impossible with the current schema.

## 18. AI Agent rules for this patch

AI Agent MUST:

- inspect existing code before creating utilities;
- reuse `lib/auth`, `lib/permissions`, `lib/security`, `server`, and current DB structures;
- preserve current landing page/dashboard UI unless a small security-state change is needed;
- preserve current database unless a security-critical relation is missing;
- use server-side authorization;
- deny by default;
- prevent horizontal and vertical privilege escalation;
- scope DB queries before returning data;
- use dummy/de-identified data only;
- run lint, typecheck, and authorization tests.

AI Agent MUST NOT:

- rebuild the project from zero;
- migrate to a monorepo during this task;
- create a second repository;
- replace Better Auth;
- replace Neon/Drizzle;
- rename every route;
- redesign the landing page;
- trust hidden sidebar items as security;
- trust `localStorage` role/session;
- expose secrets to the browser;
- fetch all patient data and filter client-side.

## 19. Definition of Done

- [ ] current project remains operational without full rebuild;
- [ ] public domain can block `/dashboard*` with not-found behavior;
- [ ] protected dashboard routes have verified server session gating;
- [ ] sensitive routes enforce server-side permissions;
- [ ] patient resources enforce ownership/assignment/scope;
- [ ] database reads are scoped to authorized records;
- [ ] Server Actions / Route Handlers repeat authorization checks;
- [ ] USER cannot escalate to ADMIN/SUPER_ADMIN routes;
- [ ] one user cannot access another user's resource by changing URL/ID;
- [ ] audit/error behavior does not leak sensitive details;
- [ ] `.env` secrets stay server-side and uncommitted;
- [ ] lint and typecheck pass;
- [ ] authorization tests pass.

## 20. Relationship to existing docs

Continue using existing canonical docs for product/database/UI requirements:

```text
docs/MASTER-PRD.md
docs/ARCHITECTURE.md
docs/DATABASE.md
docs/PERMISSIONS.md
docs/SECURITY.md
docs/ROUTE-AND-NAVIGATION.md
docs/pages/*
```

This file only adds the missing concrete decision for the current implementation stage:

```text
single current Next.js project
        +
host-aware public / portal separation
        +
public-domain /dashboard 404
        +
server session gate
        +
permission gate
        +
resource ownership / assignment
        +
DB query scoping
```

If there is a conflict specifically about this host/dashboard boundary, this patch takes precedence until canonical architecture/security docs are intentionally updated.
