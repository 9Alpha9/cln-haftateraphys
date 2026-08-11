---
title: Hafta Fisioterapi Development Workflow
version: 0.3.0
last_updated: 2026-08-12
---

# Development Workflow

## 1. AI-assisted development model

```text
Human Developer
   |
   v
Coding Agent (Codex / Claude Code / OpenCode / compatible tool)
   |
   v
9Router local routing gateway
   |
   v
Configured AI provider/model
   |
   v
Repository changes
   |
   v
Human review + automated gates
```

AI output is untrusted until reviewed and tested.

## 1A. Mandatory UI execution order

All UI phases follow `docs/MOBILE-FIRST-STRATEGY.md`:

```text
Read design docs
  -> Implement mobile/base
  -> Validate 320/360/390/430
  -> Mobile Gate
  -> Add tablet enhancements
  -> Add desktop enhancements
  -> Validate 768/834/1024/1280/1440
  -> Desktop Gate
  -> Cross-breakpoint QA
```

An AI agent must stop desktop work if Mobile Gate fails.

Canonical design inputs:

```text
docs/DESIGN-REFERENCES.md
docs/DESIGN-SYSTEM.md
docs/UI-GUIDELINES.md
assets/design-references/02-hafta-landing-direction.png
assets/design-references/03-hafta-design-system-board.png
```

## 2. Phase plan

### Phase 0 — Project initialization

- initialize latest stable Next.js App Router project;
- TypeScript strict;
- pnpm;
- Tailwind;
- shadcn/ui;
- lint/typecheck scripts;
- base test tooling;
- copy documentation package into repository root.

Exit criteria:

- app runs;
- lint/typecheck pass;
- docs committed.

### Phase 1 — Design foundation

- tokens;
- typography;
- layout primitives;
- shadcn base components;
- landing shell;
- auth shell;
- dashboard shell;
- mobile-first base components and navigation;
- validate Mobile Gate primitives before desktop shell enhancements;
- Taste Skill review against approved Hafta references.

### Phase 2 — Public landing page

Read `docs/pages/01-LANDING-PAGE.md` and implement PRD `LP-*` using content placeholders where client confirmation is pending.

Do not fabricate therapist credentials, claims, prices, opening hours, or patient testimonials.

Execution order for landing:

1. implement mobile/base version from the content hierarchy;
2. pass Mobile Gate;
3. add tablet/desktop composition based on the approved Hafta landing reference;
4. pass Desktop Gate and cross-breakpoint review.

### Phase 3 — Database + authentication

Read `docs/pages/02-AUTHENTICATION-PAGES.md`, `docs/DATABASE.md`, and `docs/SECURITY.md`.

- Neon development database;
- Drizzle schema/migration;
- Better Auth integration;
- email verification;
- reset password;
- secure sessions;
- roles.

### Phase 4 — Permission framework

Implement permission constants and object-level authorization before patient CRUD.

Write authorization tests first/alongside implementation.

### Phase 5 — Patient intake

Read `docs/pages/03-DASHBOARD-USER.md` and `docs/FORM-SPECIFICATIONS.md`.

- patient profile;
- draft/submission;
- validation;
- consent records;
- admin review.

### Phase 6 — Clinical workflow

Read `docs/pages/04-DASHBOARD-ADMIN-THERAPIST.md` and `docs/FORM-SPECIFICATIONS.md`.

- assessment;
- treatment plan;
- therapy sessions;
- finalization;
- amendment/versioning;
- patient-visible views.

### Phase 7 — Administration

Read `docs/pages/05-DASHBOARD-SUPER-ADMIN.md`.

- users;
- staff;
- roles/permissions;
- audit viewer;
- account suspension/reactivation.

### Phase 8 — Document storage

Only if required for v1:

- private R2 bucket;
- secure upload;
- signed downloads;
- document authorization;
- audit.

### Phase 9 — Security hardening

- MFA for staff;
- rate limiting;
- headers/CSP;
- logging review;
- dependency review;
- secret scan;
- abuse tests.

### Phase 10 — Staging/UAT

- client content validation;
- therapist workflow validation;
- permission/UAT;
- accessibility review;
- Mobile Gate review;
- Desktop Gate review;
- cross-breakpoint responsive review;
- data retention policy check;
- production infrastructure review.

## 3. Agent task template

Setiap task untuk AI agent sebaiknya berbentuk:

```md
TASK: <short title>
REQUIREMENTS: PRD IDs
READ FIRST: <files>
SCOPE: <routes/components>
DO NOT CHANGE: <locked areas>
PERMISSIONS: <required permissions>
DATABASE: <tables>
AUDIT: <events>
TESTS: <required tests>
DONE WHEN: <acceptance criteria>
```

## 4. Suggested agent prompt bootstrap

```text
Read AGENTS.md and README-AI.md first.
Then read the PRD section and task-specific page specification relevant to this task plus SECURITY.md and PERMISSIONS.md.
If the task changes UI, also read DESIGN-REFERENCES.md, DESIGN-SYSTEM.md, and MOBILE-FIRST-STRATEGY.md.
Do not modify locked architecture or invent requirements.
Use existing components and patterns before creating new ones.
Before coding, inspect related files.
After coding, run lint, typecheck, and relevant tests.
Never include real patient data or secrets in prompts, fixtures, logs, or tests.
```

## 5. Git discipline

Recommended branch names:

- `feat/...`
- `fix/...`
- `security/...`
- `refactor/...`
- `docs/...`

Commits should be intentional and scoped.

Do not allow an AI agent to mix unrelated refactor with security-sensitive feature unless necessary.

## 6. Quality gates

Every meaningful change:

```text
format/lint
  -> typecheck
  -> unit tests
  -> authorization tests if relevant
  -> integration tests if relevant
  -> build
  -> human review
```

## 7. Database-change gate

AI agent may draft migration but human must review any migration that:

- drops table/column;
- changes nullable -> non-null;
- changes enum lifecycle;
- modifies auth data;
- modifies patient/clinical data;
- changes permission relationships.

## 8. Security-sensitive feature gate

Mandatory second review for:

- auth;
- password reset;
- role/permission;
- patient authorization;
- export;
- document access;
- audit;
- finalization/amendment;
- secrets/environment.

## 9. 9Router rules

- 9Router config is developer-local unless team explicitly manages shared configuration.
- Provider fallback must not change product requirements.
- Model output from fallback provider is held to identical code/security rules.
- Never route live patient data through 9Router.
- Do not commit provider tokens or 9Router secrets/config containing credentials.

## 10. Context strategy for AI agents

Large context should not be achieved by dumping entire repository every prompt.

Preferred:

1. `AGENTS.md` always;
2. relevant PRD section;
3. relevant `docs/pages/*` specification or `FORM-SPECIFICATIONS.md`;
4. relevant architecture/security/permission doc;
5. exact existing source files;
6. task-specific tests.

## 11. Definition of done checklist

- [ ] PRD IDs satisfied
- [ ] no undocumented requirement added
- [ ] folder placement follows architecture
- [ ] types are strict
- [ ] validation exists
- [ ] authorization exists
- [ ] audit exists where required
- [ ] loading/empty/error states exist
- [ ] accessible
- [ ] responsive
- [ ] tests pass
- [ ] lint/typecheck pass
- [ ] no secret leaked
- [ ] no patient data exposed to AI/log/analytics
- [ ] docs updated when behavior/contracts changed
