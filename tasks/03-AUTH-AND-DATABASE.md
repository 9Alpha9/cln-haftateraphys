---
task_id: HF-TASK-003
phase: auth-database
status: ready
depends_on: [HF-TASK-000]
---

# Authentication and Database Foundation

## Read first

- `AGENTS.md`
- `docs/DESIGN-SYSTEM.md`
- `docs/MOBILE-FIRST-STRATEGY.md`
- `docs/pages/02-AUTHENTICATION-PAGES.md`
- `docs/DATABASE.md`
- `docs/SECURITY.md`
- `docs/FORM-SPECIFICATIONS.md`

## Objective

Create Neon + Drizzle foundation and secure authentication lifecycle.

## Scope

- Neon development database connection;
- Drizzle config/schema/migration foundation;
- Better Auth/project-approved integration;
- USER registration only;
- login/logout;
- email verification;
- forgot/reset password;
- account/session foundation;
- roles persisted server-side;
- seed only dummy accounts.

## Security tests

- registration cannot self-assign ADMIN/SUPER_ADMIN;
- auth errors do not enumerate accounts;
- private route rejects unauthenticated request;
- suspended/disabled policy behaves correctly;
- password/token never logged.

## Do not

- expose service secret to browser;
- manually persist plaintext password;
- trust role from request payload;
- create production patient fixtures.

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

- migrations work from clean DB;
- auth flows work;
- security tests pass;
- lint/typecheck/build pass.
