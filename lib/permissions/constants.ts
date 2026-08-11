export const PERMISSIONS = {
  // Patient domain
  PATIENT_LIST: "patient:list",
  PATIENT_READ: "patient:read",
  PATIENT_CREATE: "patient:create",
  PATIENT_UPDATE_DEMOGRAPHICS: "patient:update-demographics",
  PATIENT_ASSIGN: "patient:assign",
  PATIENT_ARCHIVE: "patient:archive",
  PATIENT_EXPORT: "patient:export",

  // Intake
  INTAKE_READ: "intake:read",
  INTAKE_CREATE_OWN: "intake:create-own",
  INTAKE_UPDATE_OWN_DRAFT: "intake:update-own-draft",
  INTAKE_REVIEW: "intake:review",
  INTAKE_REQUEST_REVISION: "intake:request-revision",
  INTAKE_ACCEPT: "intake:accept",

  // Assessment
  ASSESSMENT_READ: "assessment:read",
  ASSESSMENT_CREATE: "assessment:create",
  ASSESSMENT_UPDATE_DRAFT: "assessment:update-draft",
  ASSESSMENT_FINALIZE: "assessment:finalize",
  ASSESSMENT_AMEND: "assessment:amend",

  // Treatment plan
  TREATMENT_PLAN_READ: "treatment-plan:read",
  TREATMENT_PLAN_CREATE: "treatment-plan:create",
  TREATMENT_PLAN_UPDATE_DRAFT: "treatment-plan:update-draft",
  TREATMENT_PLAN_FINALIZE: "treatment-plan:finalize",
  TREATMENT_PLAN_AMEND: "treatment-plan:amend",

  // Therapy sessions
  SESSION_READ: "session:read",
  SESSION_CREATE: "session:create",
  SESSION_UPDATE_DRAFT: "session:update-draft",
  SESSION_FINALIZE: "session:finalize",
  SESSION_AMEND: "session:amend",

  // Documents
  DOCUMENT_LIST: "document:list",
  DOCUMENT_UPLOAD: "document:upload",
  DOCUMENT_READ: "document:read",
  DOCUMENT_DOWNLOAD: "document:download",
  DOCUMENT_ARCHIVE: "document:archive",

  // Administration
  USER_LIST: "user:list",
  USER_READ: "user:read",
  USER_SUSPEND: "user:suspend",
  USER_REACTIVATE: "user:reactivate",
  ROLE_ASSIGN: "role:assign",
  PERMISSION_MANAGE: "permission:manage",
  AUDIT_READ: "audit:read",
  SETTINGS_MANAGE: "settings:manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
