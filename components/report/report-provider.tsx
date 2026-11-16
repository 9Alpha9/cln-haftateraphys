'use client';

import { useState, type ReactNode } from 'react';
import ReportContext from '@/lib/report-context';

export function ReportProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');

  return (
    <ReportContext.Provider value={{ open, setOpen, reason, setReason }}>
      {children}
    </ReportContext.Provider>
  );
}
