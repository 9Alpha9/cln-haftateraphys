'use server';

import { and, desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/db';
import { consents, patientIntakes, patients } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import {
  CONSENT_POLICY_VERSION,
  CONSENT_TYPES,
  getConsentDefinition,
  type ConsentType,
} from '@/lib/consent';
import { ForbiddenError, hasPermission, PERMISSIONS } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';

function parseConsentType(value: unknown): ConsentType {
  if (typeof value !== 'string' || !CONSENT_TYPES.includes(value as ConsentType)) {
    throw new Error('Jenis persetujuan tidak valid.');
  }
  return value as ConsentType;
}

async function getOwnPatientId(userId: string) {
  const db = getDb();
  const [patient] = await db
    .select({ id: patients.id })
    .from(patients)
    .where(eq(patients.userId, userId))
    .limit(1);
  if (!patient) throw new ForbiddenError();
  return patient.id;
}

async function syncIntakeConsentFlags(
  patientId: string,
  type: ConsentType,
  granted: boolean,
  at: Date,
) {
  if (type !== 'PRIVACY_DATA_PROCESSING' && type !== 'MEDIA_PUBLICATION') return;

  const db = getDb();
  const [latestIntake] = await db
    .select({ id: patientIntakes.id })
    .from(patientIntakes)
    .where(eq(patientIntakes.patientId, patientId))
    .orderBy(desc(patientIntakes.version))
    .limit(1);

  if (!latestIntake) return;

  if (type === 'PRIVACY_DATA_PROCESSING') {
    await db
      .update(patientIntakes)
      .set({
        privacyConsent: granted ? 1 : 0,
        privacyConsentAt: granted ? at : null,
        updatedAt: new Date(),
      })
      .where(eq(patientIntakes.id, latestIntake.id));
    return;
  }

  await db
    .update(patientIntakes)
    .set({ mediaConsent: granted ? 1 : 0, updatedAt: new Date() })
    .where(eq(patientIntakes.id, latestIntake.id));
}

export async function grantMyConsent(input: unknown) {
  const type = parseConsentType(input);
  const definition = getConsentDefinition(type);
  if (!definition) throw new Error('Jenis persetujuan tidak dikenal.');

  const { session, role } = await requireSession({ redirectToLogin: false });
  if (!hasPermission(role, PERMISSIONS.CONSENT_GRANT_OWN)) throw new ForbiddenError();

  const patientId = await getOwnPatientId(session.user.id);
  const db = getDb();
  const now = new Date();

  await db
    .insert(consents)
    .values({
      patientId,
      type,
      policyVersion: CONSENT_POLICY_VERSION,
      status: 'GRANTED',
      grantedAt: now,
      withdrawnAt: null,
      source: 'PATIENT_PORTAL',
      capturedBy: session.user.id,
      metadataSafe: definition.publication ? 'Optional publication consent' : 'Service consent',
    })
    .onConflictDoUpdate({
      target: [consents.patientId, consents.type, consents.policyVersion],
      set: {
        status: 'GRANTED',
        grantedAt: now,
        withdrawnAt: null,
        source: 'PATIENT_PORTAL',
        capturedBy: session.user.id,
        updatedAt: now,
      },
    });

  await syncIntakeConsentFlags(patientId, type, true, now);

  await createAuditLog({
    action: 'consent.granted',
    targetType: 'consent',
    targetId: patientId,
    meta: { type, policyVersion: CONSENT_POLICY_VERSION },
    userId: session.user.id,
  });

  revalidatePath('/dashboard/consent');
  revalidatePath('/dashboard/intake');
}

export async function withdrawMyConsent(input: unknown) {
  const type = parseConsentType(input);

  const { session, role } = await requireSession({ redirectToLogin: false });
  if (!hasPermission(role, PERMISSIONS.CONSENT_WITHDRAW_OWN)) throw new ForbiddenError();

  const patientId = await getOwnPatientId(session.user.id);
  const db = getDb();
  const now = new Date();

  const [target] = await db
    .select({ id: consents.id, status: consents.status })
    .from(consents)
    .where(
      and(
        eq(consents.patientId, patientId),
        eq(consents.type, type),
        eq(consents.policyVersion, CONSENT_POLICY_VERSION),
      ),
    )
    .limit(1);

  if (!target) {
    throw new Error('Belum ada persetujuan yang dapat ditarik.');
  }
  if (target.status === 'WITHDRAWN') {
    throw new Error('Persetujuan sudah ditarik.');
  }

  await db
    .update(consents)
    .set({
      status: 'WITHDRAWN',
      withdrawnAt: now,
      updatedAt: now,
    })
    .where(eq(consents.id, target.id));

  await syncIntakeConsentFlags(patientId, type, false, now);

  await createAuditLog({
    action: 'consent.withdrawn',
    targetType: 'consent',
    targetId: patientId,
    meta: { type, policyVersion: CONSENT_POLICY_VERSION },
    userId: session.user.id,
  });

  revalidatePath('/dashboard/consent');
  revalidatePath('/dashboard/intake');
}
