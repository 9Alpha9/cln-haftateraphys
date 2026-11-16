'use client';

import { useReportContext } from '@/lib/report-context';
import { ReportDialog } from '@/components/report/report-dialog';
import { ReportProvider } from '@/components/report/report-provider';

export function ReportTrigger() {
  const { setOpen } = useReportContext();
  return (
    <button type="button" className="btn-secondary" onClick={() => setOpen(true)}>
      Laporkan Masalah
    </button>
  );
}

export function ReportArea() {
  return (
    <ReportProvider>
      <ReportTrigger />
      <ReportDialog />
    </ReportProvider>
  );
}
