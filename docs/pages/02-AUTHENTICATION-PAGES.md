---
title: Hafta Fisioterapi Authentication Pages Specification
version: 0.3.0
status: implementation-ready
last_updated: 2026-08-12
source_of_truth_for:
  - login
  - registration
  - email-verification
  - forgot-password
  - reset-password
  - auth-ux
---

# Authentication Pages Specification

> **UI implementation contract:** read `docs/DESIGN-REFERENCES.md`, `docs/DESIGN-SYSTEM.md`, and `docs/MOBILE-FIRST-STRATEGY.md`. Build and pass the mobile version first; desktop enhancement is not allowed before Mobile Gate passes.

## 1. Scope

Routes:

```text
/login
/register
/forgot-password
/reset-password
/verify-email
```

Optional system routes/state:

```text
/auth/error
/auth/session-expired
```

Authentication UI must not be treated as cosmetic only. All sensitive state is verified server-side.

## 2. Common auth layout

Recommended:

```text
app/(auth)/layout.tsx
components/auth/AuthShell.tsx
```

Layout contains:

- Hafta brand link to `/`;
- focused auth card/form;
- minimal distraction;
- privacy/terms links;
- optional clinic photo/brand panel on desktop;
- no patient medical imagery required.

Mobile must prioritize form and not force split-screen.

## 3. LOGIN

### Route

```text
/login
```

### Fields

- email;
- password.

### Actions

- Masuk;
- Lupa password;
- Buat akun;
- optional show/hide password.

### Validation

Client validation can improve UX, but server validation is authoritative.

Email:

- valid normalized email format;
- trim safe whitespace;
- do not lowercase blindly if auth provider handles normalization differently; follow auth library behavior.

Password:

- required;
- do not reveal password policy through login errors.

### Error behavior

Use generic credential error:

```text
Email atau kata sandi tidak sesuai.
```

Do not return:

```text
Email terdaftar tetapi password salah.
```

### Security

- rate-limit login attempts based on approved strategy;
- session cookie secure/HttpOnly/SameSite according to auth provider/config;
- rotate/refresh session according to auth library;
- MFA required/targeted for ADMIN/SUPER_ADMIN before production;
- do not store password in React state longer than needed;
- no credential logging.

### Redirect

After successful login:

```text
USER -> /dashboard
ADMIN -> /dashboard
SUPER_ADMIN -> /dashboard
```

Dashboard content is role-aware. Do not let client-provided redirect bypass allowed route policy.

### States

- idle;
- submitting;
- invalid credentials;
- rate limited;
- account suspended/disabled (safe wording);
- email verification required;
- MFA challenge if enabled;
- server unavailable.

## 4. REGISTER

### Route

```text
/register
```

### Goal

Create USER/patient account only unless staff invitation workflow explicitly allows otherwise.

Public registration **must never allow choosing ADMIN or SUPER_ADMIN role**.

### Minimum fields

- full name or display name if approved for account profile;
- email;
- password;
- password confirmation;
- Terms acceptance;
- Privacy Policy acknowledgement.

Do not collect full clinical intake here.

### Password policy

Use password policy consistent with auth implementation and current project security decision. Prefer length-focused policy and compromised-password protections when feasible. Do not force arbitrary composition rules unless security doc says so.

### Role assignment

Server fixed:

```text
role = USER
```

Never accept role from public form payload.

### Post-register behavior

Recommended:

1. account created;
2. verification email sent;
3. verification-required success state;
4. after verified login, patient onboarding begins.

### Anti-abuse

- registration rate limit;
- email verification;
- optional bot protection only if needed and privacy-reviewed;
- generic responses where account enumeration risk exists.

### Consent

Terms/privacy acknowledgement at account registration does **not** replace clinical consent or media/publication consent.

## 5. VERIFY EMAIL

### Route

```text
/verify-email
```

### States

- waiting/instructions;
- verification success;
- invalid/expired token;
- already verified;
- resend available;
- resend cooldown/rate limit.

### Security

- token single-purpose;
- expiry;
- do not expose token in logs;
- avoid analytics capturing query tokens;
- redirect safely after success.

## 6. FORGOT PASSWORD

### Route

```text
/forgot-password
```

### Field

- email.

### Response

Always safe generic response such as:

```text
Jika akun dengan email tersebut tersedia, instruksi pemulihan akan dikirim.
```

### Rules

- do not expose registration status;
- rate-limit;
- no health data asked;
- email provider errors should not reveal internals.

## 7. RESET PASSWORD

### Route

```text
/reset-password
```

### Fields

- new password;
- confirm new password.

### Token behavior

- short-lived;
- single-use;
- server verified;
- invalid after successful reset;
- consider invalidating/revoking other sessions based on auth policy.

### Completion state

- confirm password changed;
- CTA to login;
- no auto-login unless explicitly decided.

## 8. MFA staff flow

Target production behavior:

```text
ADMIN/SUPER_ADMIN login
 -> credential verified
 -> MFA challenge
 -> session with appropriate assurance
 -> dashboard
```

USER MFA can be optional/future unless product decides otherwise.

Recovery codes or recovery process must be designed before enabling MFA production.

## 9. Auth page visual requirements

- clear field labels;
- inline errors + optional form error summary;
- no placeholder-only labels;
- accessible password visibility button;
- obvious loading state;
- prevent duplicate submit;
- terms links open correctly;
- no medical intake fields on auth card;
- calm Hafta visual identity.

## 10. Component candidates

```text
components/auth/
├── AuthShell.tsx
├── LoginForm.tsx
├── RegisterForm.tsx
├── ForgotPasswordForm.tsx
├── ResetPasswordForm.tsx
├── VerifyEmailState.tsx
├── PasswordField.tsx
└── AuthAlert.tsx
```

Avoid creating one generic mega-form that conditionally handles every auth route if it harms clarity.

## 11. Server-side authorization post-auth

Authentication success is not authorization.

Every private page/action must still call session/permission checks.

Bad:

```ts
if (session) {
  // allow all dashboard operations
}
```

Required pattern:

```text
session exists
AND account active
AND permission present
AND resource scope allowed
AND record state allows action
```

## 12. Acceptance criteria

- [ ] public registration can only create USER;
- [ ] login error does not enumerate accounts;
- [ ] forgot password response does not enumerate accounts;
- [ ] reset token expires/is single-use according to auth config;
- [ ] verified-email requirement enforced where configured;
- [ ] staff MFA path supported/roadmapped before production;
- [ ] role not stored/trusted from client;
- [ ] auth forms accessible and responsive;
- [ ] no secrets/passwords written to logs;
- [ ] tests cover privilege escalation attempt via register payload;
- [ ] tests cover protected route without session;
- [ ] tests cover suspended/disabled account behavior.
