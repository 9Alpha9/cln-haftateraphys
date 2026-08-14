---
task_id: HF-TASK-004
phase: authorization
status: ready
depends_on: [HF-TASK-003]
---

# Permission Framework

## Read first

- `AGENTS.md`
- `docs/PERMISSIONS.md`
- `docs/SECURITY.md`
- `docs/ROUTE-AND-NAVIGATION.md`
- `docs/DATABASE.md`

## Objective

Implement default-deny RBAC + resource scope authorization before patient CRUD.

## Scope

- role enum;
- permission key definitions;
- server `authorize()` policy layer;
- account active-state checks;
- own-resource USER policy;
- therapist assignment/scope hooks;
- field-specific DTO/select patterns;
- forbidden/not-found handling;
- authorization test matrix.

## Mandatory tests

Use the minimum matrix in `docs/PERMISSIONS.md`.

## Do not

- use sidebar visibility as authorization;
- place role source-of-truth in localStorage;
- grant SUPER_ADMIN implicit clinical permission.

## Done when

Authorization helper is used by representative protected reads/mutations and attack-path tests pass.
