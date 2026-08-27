'use client';

import { useEffect } from 'react';
import { ArrowLeft, FileDown, Printer } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function PrintTrigger({
  mode,
  patientName,
  recordId,
  recordedAt,
}: {
  mode: 'print' | 'pdf';
  patientName: string;
  recordId: string;
  recordedAt: Date;
}) {
  useEffect(() => {
    const datePart = recordedAt.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const fileName = `Hafta Fisioterapi-${patientName}-${recordId.slice(0, 8).toUpperCase()}-${datePart}`;
    document.title = fileName;

    const timer = window.setTimeout(() => window.print(), 500);
    return () => window.clearTimeout(timer);
  }, [patientName, recordId, recordedAt]);

  return (
    <div className="mx-auto mb-6 flex max-w-3xl items-center justify-between print:hidden">
      <Link href="/dashboard/progress">
        <Button variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Button>
      </Link>
      <div className="flex items-center gap-2">
        {mode === 'pdf' ? (
          <p className="hidden text-xs text-muted-foreground sm:block">Pilih &quot;Save as PDF&quot; pada dialog browser.</p>
        ) : null}
        <Button size="sm" onClick={() => window.print()}>
          {mode === 'pdf' ? <FileDown className="h-4 w-4" /> : <Printer className="h-4 w-4" />}
          {mode === 'pdf' ? 'Simpan PDF' : 'Print'}
        </Button>
      </div>
    </div>
  );
}
