---
title: Hafta Fisioterapi Permissions
version: 0.1.0
last_updated: 2026-08-12
---

# Permissions and Authorization

## 1. Model

Gunakan RBAC untuk coarse role + object-level/resource authorization untuk scope pasien.

Role saja tidak cukup.

Authorization equation:

```text
ALLOW = authenticated
    AND permission_present
    AND resource_scope_allowed
    AND record_state_allows_action
```

Default = DENY.

## 2. Baseline permission keys

### Patient domain

- `patient:list`
- `patient:read`
- `patient:create`
- `patient:update-demographics`
- `patient:assign`
- `patient:archive`
- `patient:export`

### Intake

- `intake:read`
- `intake:create-own`
- `intake:update-own-draft`
- `intake:review`
- `intake:request-revision`
- `intake:accept`

### Assessment

- `assessment:read`
- `assessment:create`
- `assessment:update-draft`
- `assessment:finalize`
- `assessment:amend`

### Treatment plan

- `treatment-plan:read`
- `treatment-plan:create`
- `treatment-plan:update-draft`
- `treatment-plan:finalize`
- `treatment-plan:amend`

### Therapy sessions

- `session:read`
- `session:create`
- `session:update-draft`
- `session:finalize`
- `session:amend`

### Documents

- `document:list`
- `document:upload`
- `document:read`
- `document:download`
- `document:archive`

### Administration

- `user:list`
- `user:read`
- `user:suspend`
- `user:reactivate`
- `role:assign`
- `permission:manage`
- `audit:read`
- `settings:manage`

## 3. Role baseline

Legend:

- Y = baseline yes
- S = scoped/conditional
- N = default denied

| Permission                  | SUPER_ADMIN | ADMIN/THERAPIST | ADMIN/STAFF |             USER |
| --------------------------- | ----------: | --------------: | ----------: | ---------------: |
| patient:list                |           S |               S |           S |                N |
| patient:read                |           S |               S |   S-minimum |              own |
| patient:create              |           Y |               S |           S |                N |
| patient:update-demographics |           S |               S |           S |      own-limited |
| patient:assign              |           Y |               S |           N |                N |
| patient:archive             |           S |             N/S |           N |                N |
| patient:export              |  S-explicit |      S-explicit |           N |       own-policy |
| intake:read                 |           S |               S |   S-minimum |              own |
| intake:create-own           |           N |               N |           N |                Y |
| intake:update-own-draft     |           N |               N |           N |                Y |
| intake:review               |         N/S |        Y-scoped |   S-minimum |                N |
| assessment:read             |    explicit |        Y-scoped |           N |      visible-own |
| assessment:create           |    explicit |        Y-scoped |           N |                N |
| assessment:update-draft     |    explicit |  Y-owner/scoped |           N |                N |
| assessment:finalize         |    explicit |  Y-owner/scoped |           N |                N |
| assessment:amend            |    explicit |  Y-owner/scoped |           N |                N |
| treatment-plan:*            |    explicit |          scoped |           N | read-visible-own |
| session:*                   |    explicit |          scoped |           N | read-visible-own |
| role:assign                 |           Y |               N |           N |                N |
| permission:manage           |           Y |               N |           N |                N |
| audit:read                  |           Y |     N/S-limited |           N |                N |
| settings:manage             |           Y |               N |           N |                N |

`SUPER_ADMIN` clinical permissions are explicit, not implied.

## 4. Resource scope checks

### USER

```ts
resource.patient.userId === session.user.id;
```

and field/record must be patient-visible.

### ADMIN/THERAPIST

Typical policy:

```text
active patient assignment
OR approved coverage permission
AND clinical permission
```

### ADMIN/STAFF

Can view administrative subset only. Clinical notes hidden unless explicit clinical responsibility is later introduced.

## 5. Direct URL protection

The following must return forbidden/not found safely if unauthorized even when user manually enters URL:

- `/dashboard/patients/[patientId]`
- assessment routes;
- session routes;
- document download routes;
- audit route;
- user administration routes.

## 6. Server action pattern

```ts
export async function updateAssessment(input: unknown) {
  const session = await requireSession();
  const data = assessmentUpdateSchema.parse(input);
  const assessment = await getAssessmentMinimal(data.id);

  await authorize({
    session,
    permission: 'assessment:update-draft',
    resource: assessment,
  });

  if (assessment.status !== 'DRAFT') {
    throw new RecordFinalizedError();
  }

  // service + transaction + audit
}
```

## 7. Field-level exposure

Response object untuk USER tidak otomatis sama dengan response untuk therapist.

Gunakan DTO/select eksplisit:

- `PatientSelfView`
- `PatientAdministrativeView`
- `PatientClinicalView`

## 8. Permission tests — mandatory

Minimal test matrix:

1. USER A cannot read USER B patient.
2. USER cannot mutate finalized clinical record.
3. unassigned therapist cannot read patient if policy requires assignment.
4. assigned therapist can perform allowed clinical action.
5. staff admin cannot read clinical notes.
6. super admin without clinical permission cannot read clinical notes.
7. permission change immediately affects next server authorization check.
8. hidden UI route remains protected through direct request.
9. document signed URL cannot be generated without resource authorization.
10. export requires explicit permission and creates audit event.
