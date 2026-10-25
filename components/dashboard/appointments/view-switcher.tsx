'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, LayoutList } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ViewSwitcher() {
  const pathname = usePathname();
  const isListView = pathname === '/dashboard/appointments';
  const isCalendarView = pathname === '/dashboard/calendar';

  return (
    <div className="h-11 p-0 rounded-full bg-white border border-stone-200/90 inline-grid grid-cols-2 items-center overflow-hidden shadow-2xs shrink-0">
      <Link
        href="/dashboard/appointments"
        className={cn(
          'h-full w-full px-4 rounded-full text-xs sm:text-[13px] inline-flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 whitespace-nowrap select-none',
          isListView
            ? 'bg-[var(--hafta-ylw-100)] text-[#181700] font-bold'
            : 'bg-transparent text-stone-600 hover:text-[#181700] font-semibold',
        )}
      >
        <LayoutList className="h-4 w-4 shrink-0" /> List
      </Link>
      <Link
        href="/dashboard/calendar"
        className={cn(
          'h-full w-full px-4 rounded-full text-xs sm:text-[13px] inline-flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 whitespace-nowrap select-none',
          isCalendarView
            ? 'bg-[var(--hafta-ylw-100)] text-[#181700] font-bold'
            : 'bg-transparent text-stone-600 hover:text-[#181700] font-semibold',
        )}
      >
        <CalendarDays className="h-4 w-4 shrink-0" /> Kalender
      </Link>
    </div>
  );
}