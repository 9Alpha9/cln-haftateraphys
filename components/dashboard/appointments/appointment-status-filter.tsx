'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarClock, Check, CheckCircle2, CircleDot, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FilterPendingBar, SmartFilterMenu } from '@/components/ui/smart-filter-menu';

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
  const [pending, startTransition] = useTransition();
  const active = OPTIONS.find((option) => option.value === activeStatus) ?? OPTIONS[0];

  function selectStatus(value: string, close: () => void) {
    close();
    if (value === activeStatus) return;
    startTransition(() => {
      router.push(`/dashboard/appointments?status=${value}`);
    });
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <FilterPendingBar active={pending} />
      <p className="text-xs font-semibold text-stone-500">
        Menampilkan status: <span className="text-[#181700]">{active.label}</span>
      </p>
      <SmartFilterMenu count={counts[activeStatus] ?? counts.ALL ?? 0} pending={pending}>
        {(close) => (
          <>
            {OPTIONS.map((option) => {
              const Icon = option.icon;
              const selected = activeStatus === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => selectStatus(option.value, close)}
                  aria-pressed={selected}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-xs transition-colors sm:text-[13px]',
                    selected
                      ? 'border-stone-200 bg-[#F4F4F1] font-bold text-[#181700]'
                      : 'border-transparent font-medium text-stone-600 hover:bg-stone-100 hover:text-[#181700]',
                  )}
                >
                  <Icon className={cn('h-4 w-4 shrink-0', selected ? 'text-[#181700]' : 'text-stone-400')} />
                  <span className="flex-1">
                    {option.label} ({counts[option.value] ?? 0})
                  </span>
                  {selected ? <Check className="h-3.5 w-3.5 shrink-0 text-[#181700]" /> : null}
                </button>
              );
            })}
          </>
        )}
      </SmartFilterMenu>
    </div>
  );
}
