import type { Role } from './roles';

type DashboardRouteRule = {
  pattern: RegExp;
  roles: readonly Role[];
};

const ALL_ROLES: readonly Role[] = ['SUPER_ADMIN', 'ADMIN', 'THERAPIST', 'STAFF', 'USER'];
const STAFF_ROLES: readonly Role[] = ['SUPER_ADMIN', 'ADMIN', 'THERAPIST', 'STAFF'];
const CLINICAL_ROLES: readonly Role[] = ['SUPER_ADMIN', 'ADMIN', 'THERAPIST', 'USER'];
const ADMIN_ROLES: readonly Role[] = ['SUPER_ADMIN', 'ADMIN'];
const USER_CREATE_ROLES: readonly Role[] = ['SUPER_ADMIN', 'ADMIN', 'THERAPIST'];
const USER_LIST_ROLES: readonly Role[] = ['SUPER_ADMIN', 'ADMIN', 'STAFF'];

const ROUTE_RULES: readonly DashboardRouteRule[] = [
  { pattern: /^\/dashboard$/, roles: ALL_ROLES },
  { pattern: /^\/dashboard\/profile(?:\/|$)/, roles: ['USER'] },
  { pattern: /^\/dashboard\/patients(?:\/|$)/, roles: STAFF_ROLES },
  { pattern: /^\/dashboard\/calendar-events(?:\/|$)/, roles: ADMIN_ROLES },
  { pattern: /^\/dashboard\/calendar(?:\/|$)/, roles: STAFF_ROLES },
  { pattern: /^\/dashboard\/users\/add(?:\/|$)/, roles: USER_CREATE_ROLES },
  { pattern: /^\/dashboard\/users(?:\/|$)/, roles: USER_LIST_ROLES },
  { pattern: /^\/dashboard\/audit-logs(?:\/|$)/, roles: ADMIN_ROLES },
  { pattern: /^\/dashboard\/settings(?:\/|$)/, roles: ['SUPER_ADMIN'] },
  { pattern: /^\/dashboard\/progress(?:\/|$)/, roles: CLINICAL_ROLES },
  { pattern: /^\/dashboard\/appointments\/new(?:\/|$)/, roles: STAFF_ROLES },
  { pattern: /^\/dashboard\/appointments(?:\/|$)/, roles: ALL_ROLES },
  { pattern: /^\/dashboard\/intake(?:\/|$)/, roles: ALL_ROLES },
  { pattern: /^\/dashboard\/history(?:\/|$)/, roles: ALL_ROLES },
  { pattern: /^\/dashboard\/notifications(?:\/|$)/, roles: ALL_ROLES },
  { pattern: /^\/dashboard\/security(?:\/|$)/, roles: ALL_ROLES },
];

export function canAccessDashboardPath(role: Role, pathname: string) {
  const normalized = pathname.split('?')[0]?.replace(/\/+$/, '') || '/dashboard';
  const rule = ROUTE_RULES.find((item) => item.pattern.test(normalized));
  return rule ? rule.roles.includes(role) : false;
}
