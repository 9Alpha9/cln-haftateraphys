import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pdf } from '@react-pdf/renderer';
import { AppointmentDocument, type AppointmentPdfData } from '@/components/pdf/appointment-document';

let cachedLogo: string | null = null;

/** Logo klinik sebagai data URI agar server tidak perlu request ke dirinya sendiri. */
async function loadLogoDataUri(): Promise<string> {
  if (cachedLogo) return cachedLogo;
  const filePath = path.join(process.cwd(), 'public', 'images', 'logos', 'logos-text-pdf.png');
  const buffer = await readFile(filePath);
  cachedLogo = `data:image/png;base64,${buffer.toString('base64')}`;
  return cachedLogo;
}

function countPages(buffer: Buffer): number {
  const matches = buffer.toString('latin1').match(/\/Type\s*\/Page(?![s])/g);
  return matches?.length ?? 1;
}

/**
 * Render PDF jadwal kunjungan di server. Dipakai endpoint
 * `/dashboard/appointments/[appointmentId]/pdf` agar viewer PDF.js Generic
 * Viewer menerima berkas dengan nama file yang benar.
 */
export async function buildAppointmentPdfBuffer(record: AppointmentPdfData): Promise<Buffer> {
  const logoUrl = await loadLogoDataUri();
  const first = await pdf(<AppointmentDocument record={record} logoUrl={logoUrl} />).toBlob();
  const buffer = Buffer.from(await first.arrayBuffer());

  if (countPages(buffer) <= 1) {
    const second = await pdf(<AppointmentDocument record={record} logoUrl={logoUrl} />).toBlob();
    return Buffer.from(await second.arrayBuffer());
  }
  return buffer;
}
