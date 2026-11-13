'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Check,
  CheckCircle2,
  LayoutList,
  Search,
  Settings2,
  ShieldCheck,
  ShieldOff,
  Stethoscope,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FilterPendingBar, SmartFilterMenu } from '@/components/ui/smart-filter-menu';

type RoleFilter = '' | 'SUPER_ADMIN' | 'ADMIN' | 'THERAPIST' | 'STAFF' | 'USER';
type StatusFilter = '' | 'active' | 'suspended';

const ROLE_OPTIONS: { value: RoleFilter; label: string; icon: typeof LayoutList }[] = [
  { value: '', label: 'Semua role', icon: LayoutList },
  { value: 'SUPER_ADMIN', label: 'Super Admin', icon: ShieldCheck },
  { value: 'ADMIN', label: 'Admin', icon: Settings2 },
  { value: 'THERAPIST', label: 'Terapis', icon: Stethoscope },
  { value: 'STAFF', label: 'Staff', icon: UserCog },
  { value: 'USER', label: 'Pasien', icon: Users },
];

const STATUS_OPTIONS: { value: StatusFilter; label: string; icon: typeof LayoutList }[] = [
  { value: '', label: 'Semua status', icon: LayoutList },
  { value: 'active', label: 'Aktif', icon: CheckCircle2 },
  { value: 'suspended', label: 'Ditangguhkan', icon: ShieldOff },
];

export function UserListFilters({
  initialSearch,
  initialRole,
  initialStatus,
  perPage,
}: {
  initialSearch: string;
  initialRole: RoleFilter;
  initialStatus: StatusFilter;
  perPage: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch);
  const [role, setRole] = useState<RoleFilter>(initialRole);
  const [status, setStatus] = useState<StatusFilter>(initialStatus);
  const timerRef = useRef<number | null>(null);
  const activeFilterCount = (role ? 1 : 0) + (status ? 1 : 0);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  function apply(next: { search?: string; role?: RoleFilter; status?: StatusFilter }) {
    const nextSearch = next.search ?? search;
    const nextRole = next.role ?? role;
    const nextStatus = next.status ?? status;
    const params = new URLSearchParams();
    if (nextSearch.trim()) params.set('q', nextSearch.trim());
    if (nextRole) params.set('role', nextRole);
    if (nextStatus) params.set('status', nextStatus);
    params.set('perPage', String(perPage));
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => apply({ search: value }), 300);
  }

  function selectRole(value: RoleFilter, close: () => void) {
    setRole(value);
    close();
    apply({ role: value });
  }

  function selectStatus(value: StatusFilter, close: () => void) {
    setStatus(value);
    close();
    apply({ status: value });
  }

  return (
    <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
      <FilterPendingBar active={pending} />
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          value={search}
          onChange={(event) => handleSearchChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              if (timerRef.current) window.clearTimeout(timerRef.current);
              apply({ search });
            }
          }}
          placeholder="Cari nama, email, atau username"
          aria-label="Cari pengguna"
          className="h-10 w-full rounded-full border border-stone-200/90 bg-white pl-10 pr-10 text-xs text-[#181700] outline-none transition-all placeholder:text-stone-400 focus:border-[#181700] focus:ring-4 focus:ring-[var(--hafta-org-200)]/35 sm:text-[13px]"
        />
        {search ? (
          <button
            type="button"
            aria-label="Bersihkan pencarian"
            onClick={() => {
              setSearch('');
              if (timerRef.current) window.clearTimeout(timerRef.current);
              apply({ search: '' });
            }}
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-[#181700]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      <div className="relative shrink-0">
        <SmartFilterMenu count={activeFilterCount} pending={pending} className="w-full sm:w-auto">
          {(close) => (
            <>
              <p className="px-3 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">
                Role
              </p>
              {ROLE_OPTIONS.map((option) => {
                const Icon = option.icon;
                const selected = role === option.value;
                return (
                  <button
                    key={`role-${option.value || 'all'}`}
                    type="button"
                    onClick={() => selectRole(option.value, close)}
                    aria-pressed={selected}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-[#181700] transition-colors hover:bg-stone-100',
                      selected && 'bg-[#F4F4F1]',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-stone-500" />
                    <span className="flex-1">{option.label}</span>
                    {selected ? <Check className="h-3.5 w-3.5 shrink-0" /> : null}
                  </button>
                );
              })}

              <p className="mt-1 px-3 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">
                Status
              </p>
              {STATUS_OPTIONS.map((option) => {
                const Icon = option.icon;
                const selected = status === option.value;
                return (
                  <button
                    key={`status-${option.value || 'all'}`}
                    type="button"
                    onClick={() => selectStatus(option.value, close)}
                    aria-pressed={selected}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-[#181700] transition-colors hover:bg-stone-100',
                      selected && 'bg-[#F4F4F1]',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-stone-500" />
                    <span className="flex-1">{option.label}</span>
                    {selected ? <Check className="h-3.5 w-3.5 shrink-0" /> : null}
                  </button>
                );
              })}
            </>
          )}
        </SmartFilterMenu>
      </div>
    </div>
  );
}
