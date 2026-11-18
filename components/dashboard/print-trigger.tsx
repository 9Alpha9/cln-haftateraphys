'use client';

import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

/**
 * Navigational header for the appointment print sheet. The document itself has
 * no print button: printing is driven by the hidden print iframe host, and the
 * page only auto-prints when `?auto=1` is present (i.e. when loaded by it).
 */
export function PrintTrigger({
  patientName,
  recordId,
  recordedAt,
  medicalRecordNumber,
  backHref = '/dashboard/progress',
}: {
  patientName: string;
  recordId: string;
  recordedAt: Date;
  medicalRecordNumber?: string | null;
  backHref?: string;
}) {
  useEffect(() => {
    const dateValue = new Date(recordedAt);
    const datePart = `${dateValue.getFullYear()}-${String(dateValue.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(dateValue.getDate()).padStart(2, '0')}`;
    const rmPart = medicalRecordNumber || recordId.slice(0, 8).toUpperCase();
    document.title = `${patientName}-${rmPart}-${datePart}`;

    if (new URLSearchParams(window.location.search).get('auto') === '1') {
      const timer = window.setTimeout(() => window.print(), 400);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [patientName, recordId, recordedAt, medicalRecordNumber]);

  return (
    <div className="mx-auto mb-6 flex max-w-3xl items-center justify-between print:hidden">
      <Link href={backHref}>
        <Button variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Button>
      </Link>
    </div>
  );
}
