---
task_id: HF-TASK-007
phase: administration
status: ready
depends_on: [HF-TASK-004]
---

# SUPER_ADMIN Governance

## Read first

- `AGENTS.md`
- `docs/DESIGN-SYSTEM.md`
- `docs/MOBILE-FIRST-STRATEGY.md`
- `docs/pages/05-DASHBOARD-SUPER-ADMIN.md`
- `docs/PERMISSIONS.md`
- `docs/SECURITY.md`

## Scope

- user management;
- staff management;
- role/permission governance;
- account suspension/reactivation;
- session revoke if supported;
- audit viewer;
- system settings that actually exist.

## Invariants

- no password/hash display;
- role changes audited;
- normal audit logs immutable;
- SUPER_ADMIN clinical access remains explicit;
- high-risk actions require confirmation.

## Tests

- privilege escalation edge cases;
- permission mutation validation;
- clinical resource denied without explicit permission;
- audit log write protection.

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

Page spec acceptance criteria pass.
