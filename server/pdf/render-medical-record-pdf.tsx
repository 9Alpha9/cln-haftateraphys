import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pdf } from '@react-pdf/renderer';
import { MedicalRecordDocument, type MedicalRecordPdfData } from '@/components/pdf/medical-record-document';

let cachedLogo: string | null = null;

/** Logo klinik sebagai data URI agar server tidak perlu request ke dirinya sendiri. */
async function loadLogoDataUri(): Promise<string> {
  if (cachedLogo) return cachedLogo;
  const filePath = path.join(process.cwd(), 'public', 'images', 'logos', 'logos-text.png');
  const buffer = await readFile(filePath);
  cachedLogo = `data:image/png;base64,${buffer.toString('base64')}`;
  return cachedLogo;
}

function countPages(buffer: Buffer): number {
  const matches = buffer.toString('latin1').match(/\/Type\s*\/Page(?![s])/g);
  return matches?.length ?? 1;
}

/**
 * Render PDF rekam medis di server. Dipakai endpoint `/dashboard/progress/[id]/pdf`
 * supaya viewer PDF browser menerima berkas dengan nama file yang benar dan bisa
 * diunduh/dicetak tanpa blob URL.
 */
export async function renderMedicalRecordPdfBuffer(record: MedicalRecordPdfData): Promise<Buffer> {
  const logoUrl = await loadLogoDataUri();
  const render = async (signatureOnNewPage: boolean) => {
    const blob = await pdf(
      <MedicalRecordDocument record={record} signatureOnNewPage={signatureOnNewPage} logoUrl={logoUrl} />,
    ).toBlob();
    return Buffer.from(await blob.arrayBuffer());
  };

  const first = await render(true);
  // Sama seperti renderer di browser: bila isi hanya satu halaman, pengesahan
  // digabung agar tidak muncul halaman kosong.
  if (countPages(first) <= 2) return render(false);
  return first;
}
