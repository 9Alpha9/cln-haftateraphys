---
title: Hafta Fisioterapi Route and Navigation Matrix
version: 0.2.0
status: implementation-ready
last_updated: 2026-08-12
---

# Route and Navigation Matrix

## 1. Principles

- Route existence does not imply authorization.
- Every private route performs server-side session + permission/resource checks.
- Navigation visibility follows permission for UX, but security remains server-side.
- Use App Router route groups where useful without changing public URL.

## 2. Public routes

| Route              | Audience |          Auth | Notes                                  |
| ------------------ | -------- | ------------: | -------------------------------------- |
| `/`                | public   |            no | landing page                           |
| `/login`           | public   |            no | redirect authenticated user optionally |
| `/register`        | public   |            no | creates USER only                      |
| `/forgot-password` | public   |            no | anti-enumeration                       |
| `/reset-password`  | public   |         token | reset token required                   |
| `/verify-email`    | public   | token/session | verification state                     |
| `/privacy`         | public   |            no | required before production data intake |
| `/terms`           | public   |            no | required before production data intake |

## 3. Shared authenticated routes

| Route                         | USER | ADMIN | SUPER_ADMIN |
| ----------------------------- | ---: | ----: | ----------: |
| `/dashboard`                  |  yes |   yes |         yes |
| `/dashboard/account/security` |  yes |   yes |         yes |

Content differs by role.

## 4. USER routes

| Route                           | Permission/scope            |
| ------------------------------- | --------------------------- |
| `/dashboard/profile`            | own patient profile         |
| `/dashboard/intake`             | own intake lifecycle        |
| `/dashboard/history`            | own patient-visible records |
| `/dashboard/history/[recordId]` | own + patient-visible       |
| `/dashboard/documents`          | own + feature enabled       |

## 5. ADMIN/THERAPIST routes

| Route                             | Required policy                    |
| --------------------------------- | ---------------------------------- |
| `/dashboard/patients`             | `patient:list` + scope             |
| `/dashboard/patients/[patientId]` | `patient:read` + scope             |
| `.../intake`                      | `intake:read/review` + scope       |
| `.../assessment`                  | assessment permission + scope      |
| `.../treatment-plan`              | treatment permission + scope       |
| `.../sessions`                    | session permission + scope         |
| `.../sessions/[sessionId]`        | session permission + patient scope |
| `.../history`                     | clinical read scope                |

## 6. SUPER_ADMIN routes

| Route                       | Permission                            |
| --------------------------- | ------------------------------------- |
| `/dashboard/users`          | `user:list`                           |
| `/dashboard/users/[userId]` | `user:read`                           |
| `/dashboard/staff`          | administration permission             |
| `/dashboard/roles`          | `permission:manage` / role governance |
| `/dashboard/audit-logs`     | `audit:read`                          |
| `/dashboard/settings`       | `settings:manage`                     |

Patient clinical routes remain denied unless explicit clinical permission exists.

## 7. Navigation generation

Recommended central nav config can contain display metadata only:

```ts
type NavItem = {
  label: string;
  href: string;
  icon?: React.ComponentType;
  requiredPermission?: PermissionKey;
  roles?: Role[];
};
```

This config is for UX only. Server route/action still calls authorization.

## 8. Unauthorized behavior

- no session -> redirect `/login` for private page;
- authenticated but forbidden -> safe `403` or disclosure-safe `404` according to policy;
- mutation unauthorized -> typed safe error / forbidden response;
- never redirect forbidden clinical route to a different patient's page.

## 9. Breadcrumbs

Deep staff routes should use breadcrumbs:

```text
Pasien > {Patient Display Name} > Assessment
```

Breadcrumb content must not expose sensitive text.

## 10. Acceptance criteria

- [ ] no private route relies solely on sidebar visibility;
- [ ] USER cannot route into staff/admin pages;
- [ ] ADMIN cannot route into SUPER_ADMIN pages without permission;
- [ ] SUPER_ADMIN clinical access still explicit;
- [ ] direct URL authorization tests exist;
- [ ] navigation remains usable on mobile.
