import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { consents, patients } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import {
  CONSENT_DEFINITIONS,
  CONSENT_POLICY_VERSION,
  type ConsentStatus,
  type ConsentType,
} from '@/lib/consent';
import { ForbiddenError, hasPermission, PERMISSIONS, requirePatientAccess } from '@/lib/permissions';

export type ConsentView = {
  id: string | null;
  type: ConsentType;
  label: string;
  description: string;
  required: boolean;
  publication: boolean;
  policyVersion: string;
  status: ConsentStatus;
  grantedAt: Date | null;
  withdrawnAt: Date | null;
  source: string | null;
  outdatedVersion: boolean;
};

type ConsentRow = {
  id: string;
  type: ConsentType;
  policyVersion: string;
  status: ConsentStatus;
  grantedAt: Date | null;
  withdrawnAt: Date | null;
  source: string;
};

function buildConsentViews(rows: ConsentRow[]): ConsentView[] {
  const latestByType = new Map<ConsentType, ConsentRow>();
  for (const row of rows) {
    if (!latestByType.has(row.type)) latestByType.set(row.type, row);
  }

  return CONSENT_DEFINITIONS.map((definition) => {
    const row = latestByType.get(definition.type);
    const outdatedVersion = Boolean(row && row.policyVersion !== CONSENT_POLICY_VERSION);
    return {
      id: row?.id ?? null,
      type: definition.type,
      label: definition.label,
      description: definition.description,
      required: definition.required,
      publication: definition.publication,
      policyVersion: row?.policyVersion ?? CONSENT_POLICY_VERSION,
      status: row ? (outdatedVersion ? 'SUPERSEDED' : row.status) : 'PENDING',
      grantedAt: row?.grantedAt ?? null,
      withdrawnAt: row?.withdrawnAt ?? null,
      source: row?.source ?? null,
      outdatedVersion,
    };
  });
}

async function getConsentRows(patientId: string): Promise<ConsentRow[]> {
  const db = getDb();
  return db
    .select({
      id: consents.id,
      type: consents.type,
      policyVersion: consents.policyVersion,
      status: consents.status,
      grantedAt: consents.grantedAt,
      withdrawnAt: consents.withdrawnAt,
      source: consents.source,
    })
    .from(consents)
    .where(eq(consents.patientId, patientId))
    .orderBy(desc(consents.createdAt), desc(consents.updatedAt));
}

export async function getMyConsents(): Promise<ConsentView[]> {
  const { session, role } = await requireSession({ redirectToLogin: true });
  if (!hasPermission(role, PERMISSIONS.CONSENT_READ_OWN)) throw new ForbiddenError();

  const db = getDb();
  const [patient] = await db
    .select({ id: patients.id })
    .from(patients)
    .where(eq(patients.userId, session.user.id))
    .limit(1);

  if (!patient) throw new ForbiddenError();

  return buildConsentViews(await getConsentRows(patient.id));
}

export async function getPatientConsentsForStaff(patientId: string): Promise<ConsentView[]> {
  const { role } = await requireSession({ redirectToLogin: false });
  if (!hasPermission(role, PERMISSIONS.CONSENT_READ)) throw new ForbiddenError();

  await requirePatientAccess(patientId, PERMISSIONS.PATIENT_READ);

  return buildConsentViews(await getConsentRows(patientId));
}
