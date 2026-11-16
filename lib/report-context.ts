import { createContext, useContext } from 'react';

export type ReportContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  reason: string;
  setReason: (reason: string) => void;
};

const ReportContext = createContext<ReportContextValue | null>(null);

export function useReportContext() {
  const ctx = useContext(ReportContext);
  if (!ctx) throw new Error('useReportContext must be used within ReportProvider');
  return ctx;
}

export default ReportContext;
