'use client';

import Link from 'next/link';
import { Printer } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function AppointmentPrintLink({ appointmentId }: { appointmentId: string }) {
  return (
    <Link
      href={`/dashboard/appointments/${appointmentId}/print`}
      target="_blank"
      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
    >
      <Printer /> <span className="hidden sm:inline">Cetak</span>
    </Link>
  );
}
