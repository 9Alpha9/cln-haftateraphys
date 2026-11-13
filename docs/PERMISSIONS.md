---
title: Hafta Fisioterapi Permissions
version: 0.2.0
last_updated: 2026-11-06
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
- `patient:complete-program`

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

Role yang ada di implementasi: `SUPER_ADMIN`, `ADMIN`, `THERAPIST`, `STAFF`, `USER`.

Legend:

- Y = diberikan secara baseline
- S = diberikan dengan scope/condition
- N = tidak diberikan
- own = hanya resource milik sendiri dan patient-visible

### 3.1 Matriks permission

| Permission | SUPER_ADMIN | ADMIN | THERAPIST | STAFF | USER |
| --- | ---: | ---: | ---: | ---: | ---: |
| patient:list | Y | Y | Y | Y | N |
| patient:read | Y | Y | Y | Y | own |
| patient:create | Y | Y | Y | Y | N |
| patient:update-demographics | Y | Y | N | Y | own-limited |
| patient:assign | Y | Y | N | N | N |
| patient:archive | Y | Y | Y | Y | N |
| patient:export | Y | Y | Y | N | own-policy |
| patient:complete-program | N | Y | Y | N | N |
| intake:read | Y | Y | Y | Y | own |
| intake:create-own | N | N | N | N | Y |
| intake:update-own-draft | N | N | N | N | Y |
| intake:review | N | Y | Y | N | N |
| intake:request-revision | N | Y | Y | N | N |
| intake:accept | N | Y | Y | N | N |
| intake:archive | Y | N | N | N | N |
| assessment:read | N | Y | Y | N | visible-own |
| assessment:create | N | Y | Y | N | N |
| assessment:update-draft | N | Y | Y | N | N |
| assessment:finalize | N | Y | Y | N | N |
| assessment:amend | N | Y | Y | N | N |
| treatment-plan:read | N | Y | Y | N | visible-own |
| treatment-plan:create | N | Y | Y | N | N |
| treatment-plan:update-draft | N | Y | Y | N | N |
| treatment-plan:finalize | N | Y | Y | N | N |
| treatment-plan:amend | N | Y | Y | N | N |
| session:read | N | Y | Y | N | visible-own |
| session:create | N | Y | Y | N | N |
| session:update-draft | N | Y | Y | N | N |
| session:finalize | N | Y | Y | N | N |
| session:amend | N | Y | Y | N | N |
| document:list | N | Y | Y | Y | N |
| document:upload | N | Y | Y | N | N |
| document:read | N | Y | Y | Y | N |
| document:download | N | Y | Y | N | N |
| document:archive | N | Y | N | N | N |
| appointment:list | Y | Y | Y | Y | own |
| appointment:read | Y | Y | Y | Y | own |
| appointment:create | Y | Y | Y | Y | N |
| appointment:update | Y | Y | Y | Y | N |
| appointment:cancel | Y | Y | Y | Y | own-request |
| appointment:reschedule | Y | Y | Y | Y | own-request |
| appointment:complete | Y | Y | Y | Y | N |
| calendar-event:read | Y | Y | Y | Y | Y |
| calendar-event:manage | Y | Y | N | N | N |
| progress:read | N | Y | Y | N | own |
| user:list | Y | Y | N | Y | N |
| user:read | Y | Y | N | Y | N |
| user:create | Y | Y | Y | N | N |
| user:suspend | Y | N | N | N | N |
| user:reactivate | Y | N | N | N | N |
| role:assign | Y | N | N | N | N |
| permission:manage | Y | N | N | N | N |
| audit:read | Y | Y | N | N | N |
| settings:manage | Y | N | N | N | N |

Catatan:

- `SUPER_ADMIN` **bukan wildcard**. Permission klinis (`progress:read`, `assessment:*`, `session:*`, `document:upload`) tidak otomatis diberikan dan harus menjadi explicit grant pada perubahan terpisah.
- `user:create` untuk `ADMIN`/`THERAPIST` dibatasi server-side: hanya boleh membuat akun `USER`. Hanya `SUPER_ADMIN` yang dapat membuat akun staf.
- `audit:read` untuk `ADMIN` masih berlaku saat ini; jika Hafta ingin membatasi ke `SUPER_ADMIN`, ubah role matrix dan test.
- `progress:read` untuk `USER` hanya mengembalikan record `FINALIZED` dengan `patient_visible = true`.
- `appointment:cancel`/`reschedule` untuk `USER` hanya melalui flow appointment request, bukan akses langsung ke record.

### 3.2 Account status

Status akun terpisah dari role:

- `ACTIVE` — default; dapat login sesuai role.
- `SUSPENDED` — tidak dapat login; semua sesi aktif dihapus; data tetap tersimpan.

Aturan:

- Hanya `SUPER_ADMIN` dengan `user:suspend`/`user:reactivate` yang dapat mengubah status.
- Tidak boleh menangguhkan akun sendiri.
- Setiap perubahan status menulis audit `user.suspend`/`user.reactivate`.
- Reactivate mengembalikan status `ACTIVE` tanpa mengubah role atau data klinis.

## 4. Resource scope checks

### USER

```ts
resource.patient.userId === session.user.id;
```

and field/record must be patient-visible.

### SUPER_ADMIN

Administration only by default. Clinical access requires an explicit permission grant; it is never implied by the Super Admin role.

### ADMIN

Administrative + operational clinical permissions sesuai role matrix. Akses klinis tetap wajib melewati permission check; enforcement assignment per pasien masih parsial dan perlu diperketat sebelum production.

### THERAPIST

Implementasi v1 menegakkan:

```text
active patient assignment
AND clinical permission
```

Scope ini berlaku pada daftar pasien, pilihan pasien, detail pasien, rekam medis, rencana terapi, dan home program. Terapis tidak dapat membuka pasien yang tidak di-assign meskipun mengetahui URL-nya.

### STAFF

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
