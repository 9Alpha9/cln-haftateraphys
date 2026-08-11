---
task_id: HF-TASK-005
phase: patient-portal
status: ready
depends_on: [HF-TASK-003, HF-TASK-004]
---

# USER Patient Portal

## Read first

- `AGENTS.md`
- `docs/DESIGN-SYSTEM.md`
- `docs/MOBILE-FIRST-STRATEGY.md`
- `docs/pages/03-DASHBOARD-USER.md`
- `docs/FORM-SPECIFICATIONS.md`
- `docs/PERMISSIONS.md`
- `docs/SECURITY.md`
- `docs/DATABASE.md`

## Scope

- role-aware `/dashboard` for USER;
- patient profile;
- intake draft/submission/revision lifecycle;
- patient-visible history;
- account security;
- documents only if feature enabled.

## Database
Use canonical schema/migrations. Any schema change requires migration and doc review.

## Security tests

- USER A cannot read/update USER B;
- patientId tampering rejected;
- USER cannot change role/permission/visibility;
- USER cannot edit finalized clinical record;
- document ownership enforced.

## UX
Mobile-first. Long intake form grouped into clear steps. Patient-facing status labels must be understandable.


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
Acceptance criteria in USER page spec and authorization tests pass.
