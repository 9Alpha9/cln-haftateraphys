---
task_id: HF-TASK-000
phase: bootstrap
status: ready
depends_on: []
---

# Project Bootstrap

## Read first

- `AGENTS.md`
- `docs/ARCHITECTURE.md`
- `docs/DEVELOPMENT-WORKFLOW.md`

## Objective
Initialize the Hafta Fisioterapi application repository using the locked technology direction without implementing business features yet.

## Scope

- Next.js latest stable App Router;
- TypeScript strict;
- pnpm;
- Tailwind CSS;
- shadcn/ui initialization;
- base lint/typecheck/build scripts;
- testing foundation;
- canonical folders;
- environment template;
- documentation copied to repository root;
- initial Git ignore/security hygiene.

## Do not

- create medical schemas yet;
- invent brand/content;
- add random state management library;
- add auth provider before task HF-TASK-003 unless bootstrap requires a placeholder boundary;
- remove project docs.

## Required output

- runnable app;
- baseline folder structure;
- scripts for lint/typecheck/test/build;
- no secrets committed.

## Done when

- `pnpm lint` passes;
- typecheck passes;
- test command executes;
- production build passes;
- docs are present;
- folder structure follows architecture.
