---
task_id: HF-TASK-006
phase: clinical-workflow
status: ready-after-clinical-field-validation
depends_on: [HF-TASK-004, HF-TASK-005]
---

# ADMIN / Therapist Clinical Workflow

## Read first

- `AGENTS.md`
- `docs/DESIGN-SYSTEM.md`
- `docs/MOBILE-FIRST-STRATEGY.md`
- `docs/pages/04-DASHBOARD-ADMIN-THERAPIST.md`
- `docs/FORM-SPECIFICATIONS.md`
- `docs/PERMISSIONS.md`
- `docs/SECURITY.md`
- `docs/DATABASE.md`

## Clinical gate

Do not finalize production field terminology until Hafta therapist validates candidate clinical fields.

## Scope

- scoped patient list;
- patient detail shell;
- intake review;
- assessment draft/finalize/amend;
- treatment plan draft/finalize/amend;
- session draft/finalize/amend;
- clinical timeline;
- assignment where permitted;
- patient-visible summary controls.

## Invariants

- no clinical hard delete;
- finalize is atomic and audited;
- stale draft cannot overwrite finalized record;
- unassigned/non-permitted therapist denied;
- ADMIN/STAFF clinical notes denied by default.

## Tests

- direct URL attacks;
- assignment scope;
- finalize/amend lifecycle;
- stale update conflict;
- patient visibility DTO;
- export default deny.

## UI execution gates

If this task renders or changes UI:

1. implement base/mobile layout first;
2. validate 320/360/390/430;
3. pass Mobile Gate from `docs/MOBILE-FIRST-STRATEGY.md`;
4. only then add tablet/desktop styles;
5. validate 768/834/1024/1280/1440;
6. pass Desktop Gate and cross-breakpoint QA.

Do not start from a desktop screenshot and shrink it into mobile.

## Done when

Clinical workflow UAT can be demonstrated with dummy patients and authorization/lifecycle tests pass.
