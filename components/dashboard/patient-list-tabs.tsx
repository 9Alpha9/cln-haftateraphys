'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

type Tab = 'active' | 'archived';

interface PatientListTabsProps {
  active: Tab;
}

const TABS: { key: Tab; label: string; href: string }[] = [
  { key: 'active', label: 'Aktif', href: '/dashboard/patients' },
  { key: 'archived', label: 'Diarsipkan', href: '/dashboard/patients/archived' },
];

export function PatientListTabs({ active }: PatientListTabsProps) {
  return (
    <div
      className="inline-flex items-center gap-1 rounded-full border border-stone-200/70 bg-[#F4F4F1] p-1"
      role="tablist"
      aria-label="Status pasien"
    >
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          role="tab"
          aria-selected={active === tab.key}
          className={cn(
            'inline-flex h-9 items-center justify-center rounded-full px-4 text-xs font-semibold transition-all sm:text-[13px]',
            active === tab.key
              ? 'bg-[#181700] text-white shadow-2xs'
              : 'text-stone-500 hover:bg-white/60 hover:text-[#181700]',
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
