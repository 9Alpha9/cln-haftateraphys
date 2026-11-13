import { NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/audit';
import { ForbiddenError, UnauthenticatedError } from '@/lib/permissions';
import { getDocumentForDownload } from '@/server/queries/documents';
import { getObject } from '@/lib/storage/r2';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  context: { params: Promise<{ documentId: string }> },
) {
  try {
    const { documentId } = await context.params;
    const document = await getDocumentForDownload(documentId);
    const object = await getObject(document.storageKey);

    await createAuditLog({
      action: 'document.download',
      targetType: 'document',
      targetId: document.id,
      meta: { patientId: document.patientId },
    });

    const filename = (document.originalFilename ?? 'dokumen').replace(/["\r\n]/g, '_');
    return new Response(object.body, {
      headers: {
        'Content-Type': document.mimeType,
        'Content-Length': String(document.sizeBytes),
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Cache-Control': 'no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    if (error instanceof UnauthenticatedError || error instanceof ForbiddenError) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Dokumen tidak dapat diunduh.' }, { status: 404 });
  }
}
