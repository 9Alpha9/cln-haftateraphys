'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

type Tab = 'active' | 'archived';

interface PatientListTabsProps {
  active: Tab;
}

export function PatientListTabs({ active }: PatientListTabsProps) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-white border border-stone-200/90 w-fit">
      <Link
        href="/dashboard/patients"
        className={cn(
          'px-4 py-2 rounded-full text-xs sm:text-[13px] font-semibold transition-colors',
          active === 'active'
            ? 'bg-[var(--hafta-ylw-100)] text-[#181700] shadow-sm'
            : 'text-stone-600 hover:bg-stone-50 hover:text-[#181700]',
        )}
      >
        Aktif
      </Link>
      <Link
        href="/dashboard/patients/archived"
        className={cn(
          'px-3 py-2 rounded-full text-xs sm:text-[13px] font-semibold transition-colors',
          active === 'archived'
            ? 'bg-[var(--hafta-ylw-100)] text-[#181700] shadow-sm'
            : 'text-stone-600 hover:bg-stone-100 hover:text-[#181700]',
        )}
      >
        Diarsipkan
      </Link>
    </div>
  );
}
