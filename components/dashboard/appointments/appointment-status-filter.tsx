'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { CalendarClock, Check, CheckCircle2, ChevronDown, CircleDot, Filter, XCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const OPTIONS = [
  { value: 'ALL', label: 'Semua', icon: CircleDot },
  { value: 'SCHEDULED', label: 'Terjadwal', icon: CalendarClock },
  { value: 'COMPLETED', label: 'Selesai', icon: CheckCircle2 },
  { value: 'CANCELLED', label: 'Dibatalkan', icon: XCircle },
] as const;

export function AppointmentStatusFilter({
  activeStatus,
  counts,
}: {
  activeStatus: string;
  counts: Record<string, number>;
}) {
  const router = useRouter();
  const active = OPTIONS.find((option) => option.value === activeStatus) ?? OPTIONS[0];

  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs font-semibold text-stone-500">
        Menampilkan status: <span className="text-[#181700]">{active.label}</span>
      </p>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            'inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border px-3.5 text-xs font-semibold shadow-2xs transition-colors focus-visible:border-[#181700] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#f7f000]/35 sm:px-4 sm:text-[13px]',
            activeStatus !== 'ALL'
              ? 'border-[var(--hafta-ylw-200)] bg-[var(--hafta-ylw-50)] text-[#181700]'
              : 'border-stone-200/90 bg-white text-[#181700] hover:bg-stone-100',
          )}
        >
          <Filter className="h-4 w-4 shrink-0 text-stone-500" />
          <span>Filter</span>
          <span className="rounded-full bg-[#181700] px-1.5 py-0.5 text-[10px] font-bold text-white">
            {counts[activeStatus] ?? counts.ALL ?? 0}
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-stone-400" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => router.push(`/dashboard/appointments?status=${option.value}`)}
              className={cn(
                'gap-2',
                activeStatus === option.value && 'border border-stone-200 bg-[#F4F4F1] font-bold',
              )}
            >
              <option.icon className="h-4 w-4 text-stone-500" />
              <span className="flex-1">{option.label} ({counts[option.value] ?? 0})</span>
              {activeStatus === option.value ? <Check className="h-3.5 w-3.5" /> : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
