---
task_id: HF-TASK-008
phase: security-hardening
status: pre-production
depends_on: [HF-TASK-003, HF-TASK-004, HF-TASK-005, HF-TASK-006, HF-TASK-007]
---

# Security Hardening and Production Gate

## Read first

- `AGENTS.md`
- `docs/SECURITY.md`
- `docs/PERMISSIONS.md`
- `docs/DEVELOPMENT-WORKFLOW.md`

## Scope

- staff MFA production gate;
- rate limiting;
- security headers/CSP according to deployed stack;
- secret scan;
- dependency/security review;
- logging redaction review;
- upload security review;
- auth/session review;
- authorization attack suite;
- export audit review;
- data retention/consent production decision check;
- privacy/terms availability;
- backup/recovery review.

## 9Router/AI checks

- no patient production data routed through 9Router;
- no AI provider tokens committed;
- no real patient data in tests/fixtures/prompts/logs.

## Production blockers

Do not launch patient data collection if:

- staff MFA requirement unresolved;
- privacy/terms/consent copy unresolved;
- clinical fields not validated;
- authorization test failures;
- audit critical events missing;
- backup/recovery policy missing;
- secrets exposed;
- storage bucket public unintentionally.

## Done when

Human security review + automated gates + UAT pass.
