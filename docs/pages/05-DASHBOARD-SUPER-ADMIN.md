---
title: Hafta Fisioterapi SUPER_ADMIN Dashboard Specification
version: 0.3.0
status: implementation-ready
last_updated: 2026-08-12
source_of_truth_for:
  - super-admin-dashboard
  - account-administration
  - role-permission-management
  - audit-viewer
  - system-settings
---

# SUPER_ADMIN Dashboard Specification

> **UI implementation contract:** read `docs/DESIGN-REFERENCES.md`, `docs/DESIGN-SYSTEM.md`, and `docs/MOBILE-FIRST-STRATEGY.md`. Build and pass the mobile version first; desktop enhancement is not allowed before Mobile Gate passes.


## 1. Principle

SUPER_ADMIN is system governance role, not automatically a clinical omniscient role.

```text
SUPER_ADMIN != unrestricted clinical access
```

Clinical read/write still requires explicit clinical permission and resource policy.

## 2. Information architecture

```text
/dashboard
/dashboard/users
/dashboard/users/[userId]
/dashboard/staff
/dashboard/staff/[staffId]          optional
/dashboard/roles
/dashboard/audit-logs
/dashboard/settings
/dashboard/account/security
```

Patient clinical navigation should not appear unless explicit permission is granted.

## 3. Dashboard home

Operational/security summary candidates:

- accounts requiring action;
- staff verification/invite state;
- recent role/permission changes;
- security alerts that product actually implements;
- recent audit activity summary;
- system configuration status.

Avoid exposing aggregate clinical information merely because role is SUPER_ADMIN.

## 4. User management

### Route

```text
/dashboard/users
```

### Safe list fields

- display name;
- email;
- role;
- account status;
- verification status;
- created date;
- last login timestamp if privacy/security policy permits.

### Actions

- view account;
- suspend;
- reactivate;
- resend invite/verification if supported;
- revoke sessions;
- assign approved role;
- archive/deactivate according to auth model.

### Prohibited

- reading password hash;
- resetting password to known plaintext;
- showing auth secrets;
- silent role elevation without audit.

## 5. Staff management

### Purpose
Manage staff identity/subtype, account state, and operational permissions.

Candidate fields:

- user/account link;
- staff subtype `THERAPIST | STAFF`;
- active status;
- verified credential metadata only if product needs it;
- public profile visibility;
- therapist display profile fields;
- permission profile / role link.

Clinical privileges must be explicit.

## 6. Role & permission management

### Route

```text
/dashboard/roles
```

### Baseline model

Roles locked at top-level:

```text
SUPER_ADMIN
ADMIN
USER
```

Fine-grained permission mapping can be managed separately.

### Requirements

- permission changes audited;
- prevent accidental removal of last recoverable SUPER_ADMIN if relevant;
- dangerous permission combinations highlighted;
- no role assignment by ordinary ADMIN;
- changes take effect on next authorization request/session policy according to implementation;
- server rejects unknown permission keys.

### Confirmation
High-risk actions require explicit confirmation with impact summary.

## 7. Audit log viewer

### Route

```text
/dashboard/audit-logs
```

### Read-only
Normal UI must not offer edit/delete.

### Filters

- actor;
- action type;
- resource type;
- date range;
- success/failure if logged;
- account/security category.

### Display fields

- timestamp;
- actor safe identity;
- action;
- target/resource reference;
- result;
- safe metadata.

### Sensitive data minimization
Do not log/display full complaint, clinical narrative, password, token, cookie, document body, or secret.

### Export
Audit export is separate privileged capability if ever enabled.

## 8. System settings

### Route

```text
/dashboard/settings
```

Only settings that actually exist should be shown.

Candidate categories:

- clinic public contact configuration;
- feature flags;
- patient registration policy;
- default visibility policies;
- allowed upload limits/types;
- security policy display;
- public profile settings.

Secrets must not be stored/exposed through ordinary settings page unless a dedicated secure secret-management workflow exists.

## 9. Account security

SUPER_ADMIN should have strongest protection:

- MFA mandatory before production;
- session revoke;
- recent security activity if supported;
- re-authentication for high-risk actions where feasible;
- no shared accounts.

## 10. Clinical access gate

If SUPER_ADMIN tries to open patient clinical resource without explicit permission:

```text
403 / safe Not Found according to disclosure policy
```

UI hiding is not sufficient.

If clinical permission is granted, all patient scoping and audit rules still apply.

## 11. High-risk action examples

Require strong confirmation and audit:

- promote user to SUPER_ADMIN;
- change role;
- manage permissions;
- suspend staff;
- revoke all sessions;
- change registration policy;
- enable bulk export;
- alter security-sensitive configuration.

## 12. Dashboard components candidate

```text
components/dashboard/admin/
├── UserManagementTable.tsx
├── AccountStatusBadge.tsx
├── UserActionMenu.tsx
├── StaffManagementTable.tsx
├── PermissionMatrixEditor.tsx
├── RoleChangeDialog.tsx
├── AuditLogTable.tsx
├── AuditLogFilters.tsx
└── SystemSettingsForm.tsx
```

Permission matrix editor must not become source-of-truth on client; server validates every change.

## 13. Acceptance criteria

- [ ] SUPER_ADMIN can manage account status safely;
- [ ] role/permission changes server-validated and audited;
- [ ] normal audit logs cannot be edited/deleted;
- [ ] MFA required/production gate documented;
- [ ] SUPER_ADMIN without clinical permission cannot access clinical records;
- [ ] no secret/password/hash exposed;
- [ ] dangerous actions use confirmation;
- [ ] permission changes reflected by server authorization;
- [ ] tests cover attempted self/other privilege escalation edge cases.
