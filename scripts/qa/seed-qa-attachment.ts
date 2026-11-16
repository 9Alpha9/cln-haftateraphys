/**
 * Unggah satu foto analisa dummy untuk QA PDF rekam medis.
 * Jalankan:
 *   ./node_modules/.bin/tsx --env-file-if-exists=.env scripts/qa/seed-qa-attachment.ts /tmp/ct-scan-qa.png
 */
import { readFile } from 'node:fs/promises';
import { and, eq } from 'drizzle-orm';
import { getDb } from '../../db';
import { patientDocuments, patients, users } from '../../db/schema';
import { uploadObject } from '../../lib/storage/r2';

async function main() {
  const filePath = process.argv[2];
  if (!filePath) throw new Error('Path gambar wajib diberikan.');

  const db = getDb();
  const [patient] = await db
    .select({ id: patients.id, fullName: patients.fullName })
    .from(patients)
    .innerJoin(users, eq(patients.userId, users.id))
    .where(eq(users.email, 'patient1@dummy.hafta.test'))
    .limit(1);
  if (!patient) throw new Error('Pasien dummy tidak ditemukan.');

  const file = await readFile(filePath);
  const body = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer;
  const storageKey = `patients/${patient.id}/qa-ct-scan-${Date.now()}.png`;
  await uploadObject({ key: storageKey, body, contentType: 'image/png' });

  const [inserted] = await db
    .insert(patientDocuments)
    .values({
      patientId: patient.id,
      storageKey,
      originalFilename: 'ct-scan-lumbal-qa.png',
      mimeType: 'image/png',
      sizeBytes: body.byteLength,
      documentType: 'EXAM_RESULT',
      patientVisible: 1,
      status: 'ACTIVE',
    })
    .returning({ id: patientDocuments.id });

  console.log(`Attachment QA dibuat: ${inserted.id} untuk ${patient.fullName}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
