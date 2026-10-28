'use client';

import { useRef, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Filter, ChevronDown, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PatientListFilters({ initialSearch, initialStatus }: { initialSearch: string; initialStatus: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
const [isFilterOpen, setIsFilterOpen] = useState(false);
const timerRef = useRef<number | null>(null);
const triggerRef = useRef<HTMLDivElement>(null);

  const statusLabels: Record<string, string> = {
    '': 'Semua Status',
    INTAKE: 'Intake',
    ACTIVE: 'Aktif',
    ON_HOLD: 'Ditunda',
    COMPLETED: 'Selesai',
    REFERRED: 'Rujuk',
  };

  function applyFilters(nextSearch: string, nextStatus: string) {
    const params = new URLSearchParams();
    if (nextSearch.trim()) params.set('q', nextSearch.trim());
    if (nextStatus) params.set('status', nextStatus);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => applyFilters(value, status), 300);
  }

  function handleStatusChange(value: string) {
    setStatus(value);
    setIsFilterOpen(false);
    applyFilters(search, value);
  }

  const openMenu = useCallback(() => setIsFilterOpen((prev) => !prev), []);

  useCallback(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFilterOpen(false);
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleEscape);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="flex items-center justify-between gap-2.5 w-full mb-3">
      <div className="relative flex-1 min-w-0">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <input
          value={search}
          onChange={(event) => handleSearchChange(event.target.value)}
          placeholder="Cari nama pasien"
          className="w-full h-10 pl-9 pr-4 rounded-full bg-white border border-stone-200/90 text-xs sm:text-[13px] text-[#181700] placeholder:text-stone-400 focus:outline-none focus:border-[#181700] focus:ring-4 focus:ring-[#f7f000]/35 transition-all"
        />
      </div>
      <div className="relative inline-flex shrink-0 ml-auto" ref={triggerRef}>
        <button
          type="button"
          onClick={openMenu}
          className="h-10 px-4 rounded-full bg-white hover:bg-stone-100 text-[#181700] border border-stone-200/90 text-xs sm:text-[13px] font-semibold inline-flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0 focus-visible:outline-none focus-visible:border-[#181700] focus-visible:ring-4 focus-visible:ring-[#f7f000]/35"
        >
          <Filter className="w-3.5 h-3.5 shrink-0 text-stone-500" />
          <span>Filter</span>
          <ChevronDown className="w-3.5 h-3.5 shrink-0 text-stone-400" />
        </button>

        {isFilterOpen && (
          <div className="absolute right-0 top-full mt-2 z-50 w-44 rounded-2xl bg-white border border-stone-200/90 shadow-[0_12px_32px_rgba(24,23,0,0.14)] p-1.5 origin-top-right">
            {Object.entries(statusLabels).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => handleStatusChange(value)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-full px-3 py-2 text-left text-xs font-medium transition-colors hover:bg-stone-50',
                  status === value
                    ? 'bg-[#FEFEF6] text-[#181700] font-bold'
                    : 'text-stone-700',
                )}
              >
                {status === value ? <CheckCircle2 className="h-3.5 w-3.5 text-[#181700]" /> : null}
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
