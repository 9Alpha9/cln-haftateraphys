import { and, desc, eq, ilike, inArray, isNull, or } from 'drizzle-orm';
import { getDb } from '@/db';
import { patientAssignments, patientDocuments, patients, users } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { ForbiddenError, hasPermission, PERMISSIONS } from '@/lib/permissions';
import type { Role } from '@/lib/permissions/roles';
import type { DocumentView } from '@/lib/documents';

export type { DocumentView } from '@/lib/documents';
export {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPES,
  isAllowedDocumentMime,
  MAX_DOCUMENT_BYTES,
} from '@/lib/documents';

function therapistScope(role: Role, userId: string) {
  if (role !== 'THERAPIST') return undefined;
  const db = getDb();
  return inArray(
    patientDocuments.patientId,
    db
      .select({ id: patientAssignments.patientId })
      .from(patientAssignments)
      .where(
        and(
          eq(patientAssignments.staffUserId, userId),
          isNull(patientAssignments.activeUntil),
        ),
      ),
  );
}

export async function listDocuments(params?: {
  search?: string;
  type?: string;
}): Promise<DocumentView[]> {
  const { session, role } = await requireSession({ redirectToLogin: true });
  if (!hasPermission(role, PERMISSIONS.DOCUMENT_LIST)) throw new ForbiddenError();

  const db = getDb();
  const search = params?.search?.trim();
  const type = params?.type?.trim();
  const scope = therapistScope(role, session.user.id);

  const conditions = [
    scope,
    type && type !== 'ALL' ? eq(patientDocuments.documentType, type as never) : undefined,
    search
      ? or(
          ilike(patientDocuments.originalFilename, `%${search}%`),
          ilike(patients.fullName, `%${search}%`),
          ilike(patients.medicalRecordNumber, `%${search}%`),
        )
      : undefined,
  ].filter(Boolean);

  const rows = await db
    .select({
      id: patientDocuments.id,
      patientId: patientDocuments.patientId,
      patientName: patients.fullName,
      medicalRecordNumber: patients.medicalRecordNumber,
      originalFilename: patientDocuments.originalFilename,
      mimeType: patientDocuments.mimeType,
      sizeBytes: patientDocuments.sizeBytes,
      documentType: patientDocuments.documentType,
      patientVisible: patientDocuments.patientVisible,
      status: patientDocuments.status,
      uploadedByName: users.name,
      createdAt: patientDocuments.createdAt,
    })
    .from(patientDocuments)
    .innerJoin(patients, eq(patients.id, patientDocuments.patientId))
    .leftJoin(users, eq(users.id, patientDocuments.uploadedBy))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(patientDocuments.createdAt))
    .limit(200);

  return rows.map((row) => ({
    ...row,
    patientVisible: row.patientVisible === 1,
  }));
}

export type DocumentDownload = {
  id: string;
  patientId: string;
  storageKey: string;
  originalFilename: string | null;
  mimeType: string;
  sizeBytes: number;
};

export async function getDocumentForDownload(documentId: string): Promise<DocumentDownload> {
  const { session, role } = await requireSession({ redirectToLogin: false });
  if (!hasPermission(role, PERMISSIONS.DOCUMENT_DOWNLOAD)) throw new ForbiddenError();

  const db = getDb();
  const [document] = await db
    .select({
      id: patientDocuments.id,
      patientId: patientDocuments.patientId,
      storageKey: patientDocuments.storageKey,
      originalFilename: patientDocuments.originalFilename,
      mimeType: patientDocuments.mimeType,
      sizeBytes: patientDocuments.sizeBytes,
      status: patientDocuments.status,
    })
    .from(patientDocuments)
    .where(eq(patientDocuments.id, documentId))
    .limit(1);

  if (!document || document.status === 'ARCHIVED') {
    throw new Error('Dokumen tidak ditemukan.');
  }

  if (role === 'THERAPIST') {
    const [assignment] = await db
      .select({ id: patientAssignments.id })
      .from(patientAssignments)
      .where(
        and(
          eq(patientAssignments.patientId, document.patientId),
          eq(patientAssignments.staffUserId, session.user.id),
          isNull(patientAssignments.activeUntil),
        ),
      )
      .limit(1);
    if (!assignment) throw new ForbiddenError();
  }

  return document;
}
