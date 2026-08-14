import { type Permission, PERMISSIONS } from './constants';
import { type Role, ROLE_PERMISSIONS } from './roles';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

export interface AuthSession {
  user: AuthUser;
}

export interface AuthorizationContext {
  session: AuthSession;
  permission: Permission;
  resource?: {
    userId?: string;
    patientId?: string;
    therapistId?: string;
    status?: string;
    patientVisible?: boolean;
  };
}

export class ForbiddenError extends Error {
  constructor(message = 'Akses ditolak') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class UnauthenticatedError extends Error {
  constructor(message = 'Silakan login terlebih dahulu') {
    super(message);
    this.name = 'UnauthenticatedError';
  }
}

export function hasPermission(role: Role, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role];
  return rolePermissions.includes(permission);
}

export function authorize(context: AuthorizationContext): void {
  const { session, permission, resource } = context;

  if (!session?.user) {
    throw new UnauthenticatedError();
  }

  const { role } = session.user;

  // Check if role has the permission
  if (!hasPermission(role, permission)) {
    throw new ForbiddenError();
  }

  // Resource scope checks
  if (resource) {
    // USER can only access own resources
    if (role === 'USER') {
      if (resource.userId && resource.userId !== session.user.id) {
        throw new ForbiddenError();
      }
    }

    // Check patient visibility for clinical records
    const visibilityPermissions = [
      PERMISSIONS.ASSESSMENT_READ,
      PERMISSIONS.TREATMENT_PLAN_READ,
      PERMISSIONS.SESSION_READ,
    ];
    if (visibilityPermissions.includes(permission as (typeof visibilityPermissions)[number])) {
      if (role === 'USER' && resource.patientVisible === false) {
        throw new ForbiddenError();
      }
    }
  }
}

export function canAccessPatient(
  session: AuthSession,
  patientUserId: string,
  options?: { assigned?: boolean; hasExplicitClinicalScope?: boolean },
): boolean {
  const { role, id: userId } = session.user;

  if (role === 'USER') {
    return userId === patientUserId;
  }

  if (['ADMIN', 'THERAPIST', 'STAFF'].includes(role)) {
    return options?.assigned === true;
  }

  if (role === 'SUPER_ADMIN') {
    return options?.hasExplicitClinicalScope === true;
  }

  return false;
}
