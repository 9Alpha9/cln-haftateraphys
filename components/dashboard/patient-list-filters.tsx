'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Activity,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Filter,
  LayoutList,
  PauseCircle,
  Search,
  Share2,
  Stethoscope,
  UserRound,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TherapistOption = { id: string; label: string };

export function PatientListFilters({
  initialSearch,
  initialStatus,
  initialTherapist,
  therapistOptions,
}: {
  initialSearch: string;
  initialStatus: string;
  initialTherapist: string;
  therapistOptions: TherapistOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [therapist, setTherapist] = useState(initialTherapist);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const timerRef = useRef<number | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const activeFilterCount = (status ? 1 : 0) + (therapist ? 1 : 0);

  const statusOptions = [
    { value: '', label: 'Semua Status', icon: LayoutList },
    { value: 'INTAKE', label: 'Intake', icon: ClipboardList },
    { value: 'ACTIVE', label: 'Aktif', icon: Activity },
    { value: 'ON_HOLD', label: 'Ditunda', icon: PauseCircle },
    { value: 'COMPLETED', label: 'Selesai', icon: CheckCircle2 },
    { value: 'REFERRED', label: 'Rujuk', icon: Share2 },
  ] as const;

  function applyFilters(nextSearch: string, nextStatus: string, nextTherapist: string) {
    const params = new URLSearchParams();
    if (nextSearch.trim()) params.set('q', nextSearch.trim());
    if (nextStatus) params.set('status', nextStatus);
    if (nextTherapist) params.set('therapist', nextTherapist);
    const perPage = searchParams.get('perPage');
    if (perPage) params.set('perPage', perPage);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => applyFilters(value, status, therapist), 300);
  }

  function handleStatusChange(value: string) {
    setStatus(value);
    setIsFilterOpen(false);
    applyFilters(search, value, therapist);
  }

  function handleTherapistChange(value: string) {
    setTherapist(value);
    setIsFilterOpen(false);
    applyFilters(search, status, value);
  }

  useEffect(() => {
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
    <div className="flex w-full items-center justify-between gap-2.5">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <input
          value={search}
          onChange={(event) => handleSearchChange(event.target.value)}
          placeholder="Cari nama pasien"
          className="h-10 w-full rounded-full border border-stone-200/90 bg-white pl-10 pr-10 text-xs text-[#181700] shadow-2xs outline-none transition-all placeholder:text-stone-400 focus:border-[#181700] focus:ring-4 focus:ring-[#f7f000]/35 sm:text-[13px]"
        />
        {search ? (
          <button
            type="button"
            aria-label="Bersihkan pencarian"
            onClick={() => {
              setSearch('');
              applyFilters('', status, therapist);
            }}
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-[#181700]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      <div className="relative ml-auto inline-flex shrink-0" ref={triggerRef}>
        <button
          type="button"
          onClick={() => setIsFilterOpen((prev) => !prev)}
          aria-expanded={isFilterOpen}
          aria-haspopup="menu"
          className={cn(
            'inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border px-3.5 text-xs font-semibold shadow-2xs transition-colors focus-visible:border-[#181700] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#f7f000]/35 sm:px-4 sm:text-[13px]',
            activeFilterCount > 0
              ? 'border-[var(--hafta-ylw-200)] bg-[var(--hafta-ylw-50)] text-[#181700]'
              : 'border-stone-200/90 bg-white text-[#181700] hover:bg-stone-100',
          )}
        >
          <Filter className="h-4 w-4 shrink-0 text-stone-500" />
          <span>Filter</span>
          {activeFilterCount > 0 ? (
            <span className="rounded-full bg-[#181700] px-1.5 py-0.5 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          ) : null}
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-stone-400" />
        </button>

        {isFilterOpen && (
          <div className="absolute right-0 top-full z-20 mt-2 flex max-h-[70vh] w-60 origin-top-right flex-col gap-1 overflow-y-auto rounded-2xl border border-stone-200/90 bg-white p-2 shadow-[0_12px_32px_rgba(24,23,0,0.14)]">
            <p className="px-3 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">
              Status
            </p>
            {statusOptions.map((option) => {
              const selected = status === option.value;
              const Icon = option.icon;
              return (
                <button
                  key={`status-${option.value || 'all'}`}
                  type="button"
                  onClick={() => handleStatusChange(option.value)}
                  aria-pressed={selected}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs transition-colors',
                    selected
                      ? 'bg-[#F4F4F1] font-bold text-[#181700]'
                      : 'font-medium text-stone-600 hover:bg-stone-100 hover:text-[#181700]',
                  )}
                >
                  <Icon className={cn('h-4 w-4 shrink-0', selected ? 'text-[#181700]' : 'text-stone-400')} />
                  <span className="flex-1 truncate">{option.label}</span>
                  {selected ? <Check className="h-3.5 w-3.5 shrink-0 text-[#181700]" /> : null}
                </button>
              );
            })}

            <p className="mt-1 px-3 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">
              Terapis
            </p>
            <button
              type="button"
              onClick={() => handleTherapistChange('')}
              aria-pressed={!therapist}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs transition-colors',
                !therapist
                  ? 'bg-[#F4F4F1] font-bold text-[#181700]'
                  : 'font-medium text-stone-600 hover:bg-stone-100 hover:text-[#181700]',
              )}
            >
              <LayoutList className={cn('h-4 w-4 shrink-0', !therapist ? 'text-[#181700]' : 'text-stone-400')} />
              <span className="flex-1 truncate">Semua terapis</span>
              {!therapist ? <Check className="h-3.5 w-3.5 shrink-0 text-[#181700]" /> : null}
            </button>
            {therapistOptions.map((option) => {
              const selected = therapist === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleTherapistChange(option.id)}
                  aria-pressed={selected}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs transition-colors',
                    selected
                      ? 'bg-[#F4F4F1] font-bold text-[#181700]'
                      : 'font-medium text-stone-600 hover:bg-stone-100 hover:text-[#181700]',
                  )}
                >
                  <Stethoscope
                    className={cn('h-4 w-4 shrink-0', selected ? 'text-[#181700]' : 'text-stone-400')}
                  />
                  <span className="flex-1 truncate">{option.label}</span>
                  {selected ? <Check className="h-3.5 w-3.5 shrink-0 text-[#181700]" /> : null}
                </button>
              );
            })}
            {therapistOptions.length === 0 ? (
              <p className="px-3 pb-1 text-[11px] text-stone-400">
                <UserRound className="mr-1 inline h-3 w-3" />
                Belum ada terapis aktif.
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
