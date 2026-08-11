---
title: Hafta Fisioterapi Security Baseline
version: 0.1.0
last_updated: 2026-08-12
classification: sensitive-application-guidance
---

# Security Baseline

## 1. Threat model summary

Aplikasi akan menyimpan identitas pasien dan data kesehatan/clinical record. Dampak akses tidak sah dapat tinggi.

Primary threats:

- account takeover;
- broken access control / IDOR;
- privilege escalation;
- credential stuffing/brute force;
- session theft;
- unsafe file upload/download;
- accidental data leakage through logs/analytics;
- secret leakage;
- SQL/data integrity errors;
- malicious/stale AI-generated code;
- insider over-permission;
- destructive clinical record edits.

## 2. Authentication

Use established auth library/integration; do not build password auth primitives manually.

Requirements:

- secure password hashing from auth library;
- email verification;
- reset token expiration + single use;
- session revocation;
- rate limiting for auth-sensitive endpoints/actions;
- MFA for ADMIN and SUPER_ADMIN before production;
- generic login/reset responses where user enumeration is a concern.

OWASP currently prefers Argon2id for new custom password storage. If using Better Auth default secure password handling, do not bypass it just to manually add bcrypt.

## 3. Password policy

- Allow password manager use.
- Do not silently truncate.
- Avoid arbitrary composition rules that harm usability.
- Add minimum length based on current auth guidance.
- Consider compromised-password defense if integration is available and privacy-safe.

## 4. Session security

Cookie/session requirements:

- HttpOnly;
- Secure in production;
- appropriate SameSite;
- session rotation/revocation supported;
- no auth token in localStorage;
- no role source-of-truth in client state.

## 5. Authorization

Authorization must happen server-side for every sensitive read/mutation.

Never rely only on:

- middleware/proxy;
- hidden button;
- route navigation guard;
- client component check;
- unpredictable UUID.

Implement permission + object scope checks according to `PERMISSIONS.md`.

## 6. Input validation

All external input is untrusted:

- form payload;
- URL params;
- query params;
- headers;
- file metadata;
- server action arguments.

Use Zod at trust boundary.

Database constraints remain necessary even when Zod exists.

## 7. SQL/database security

- Use Drizzle parameterized queries.
- Do not construct raw SQL from user input.
- Database credentials server-only.
- Separate development/preview/production databases.
- Production access limited to minimum personnel.
- Review migration before production.

## 8. Clinical record integrity

- Drafts can be edited by authorized author/scope.
- Finalized records cannot be silently overwritten.
- Corrections create amendment/version history.
- No ordinary hard delete.
- Finalize/amend actions create audit event.

## 9. File upload security

When document upload is enabled:

- private bucket;
- explicit allowed MIME/content types;
- file-size limit;
- randomized storage keys;
- never trust original extension;
- malware scanning strategy for production if feasible;
- do not execute uploaded content;
- signed, short-lived download URL after authorization;
- no public directory listing;
- audit sensitive downloads where policy requires.

## 10. Logging

MUST NOT log:

- passwords;
- reset tokens;
- session cookies;
- auth secrets;
- storage signed URLs if reusable;
- raw patient clinical notes;
- full patient document contents;
- full database connection string.

Audit metadata should describe action, not replicate sensitive record content.

## 11. Analytics/privacy

Never send these to public analytics:

- patient ID where avoidable;
- medical record number;
- name/email/phone;
- complaint/diagnosis/free text;
- document name/content;
- therapist notes;
- URL containing patient-sensitive params.

Prefer analytics only for public marketing pages unless a privacy review approves otherwise.

## 12. CSRF/request safety

Use framework/auth mechanisms appropriately. For cookie-authenticated mutations, ensure requests cannot be forged cross-site through the chosen Server Action/route design and auth library protections.

Do not create state-changing GET routes.

## 13. XSS/content safety

- Avoid `dangerouslySetInnerHTML` for patient-supplied content.
- If rich text is introduced, sanitize using an established sanitizer.
- Escape output by default through React.

## 14. Security headers

Production should review and configure:

- Content-Security-Policy;
- frame-ancestors / anti-clickjacking policy;
- Referrer-Policy;
- Permissions-Policy where relevant;
- HSTS on controlled HTTPS domain.

CSP must be tested with Next.js deployment and third-party integrations.

## 15. Rate limiting

Apply risk-based limits to:

- login;
- register;
- reset password;
- resend verification;
- privileged export;
- sensitive search endpoint if abuse risk exists;
- signed URL generation.

Rate limit implementation must work in deployed runtime, not only in-memory per instance.

## 16. Secrets management

- `.env*` production secrets never committed.
- `.env.example` contains keys only, no real values.
- Rotate secret if accidentally exposed.
- Use platform secret/environment management.
- Client-exposed env names must be intentionally public.

## 17. AI/9Router policy

9Router and coding agents are development tools only.

Allowed:

- source code;
- dummy schema examples;
- anonymized fixtures;
- public requirements;
- sanitized errors without patient content.

Forbidden:

- production database dumps;
- real patient records;
- real patient images;
- actual documents;
- secrets/tokens/cookies;
- live clinical free text.

If an AI tool needs a bug reproduction, create synthetic data.

## 18. Dependency security

- Minimize dependencies.
- Use lockfile.
- Review package provenance and maintenance.
- Keep framework/auth/security dependencies updated intentionally.
- Do not blindly run AI-suggested install commands.

## 19. Error responses

Client response:

- generic where needed;
- no stack trace;
- no SQL details;
- no secret values;
- do not reveal existence of unauthorized patient resource unnecessarily.

Server logging can include request correlation ID without sensitive payload.

## 20. Backup and recovery

Before clinical production:

- backup strategy documented;
- restore test completed;
- incident owner defined;
- recovery objectives discussed;
- production plan reviewed beyond free-tier assumptions.

## 21. Security testing gates

Required before production:

- authorization matrix tests;
- direct-object access tests;
- authentication abuse tests;
- session invalidation tests;
- file access tests;
- input validation tests;
- dependency review;
- secret scan;
- production logging review;
- backup/restore check.

## 22. Legal/compliance note

Clinical and personal data processing must be reviewed against applicable Indonesian privacy and health-record obligations before launch. Technical documents here are engineering guidance, not a legal opinion.
