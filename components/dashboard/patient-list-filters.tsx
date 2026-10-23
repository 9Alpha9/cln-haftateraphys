'use client';

import { useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Select } from '@/components/ui/select';

export function PatientListFilters({ initialSearch, initialStatus }: { initialSearch: string; initialStatus: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const timerRef = useRef<number | null>(null);

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
    if (timerRef.current) window.clearTimeout(timerRef.current);
    applyFilters(search, value);
  }

  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_11rem]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <input
          value={search}
          onChange={(event) => handleSearchChange(event.target.value)}
          placeholder="Cari nama pasien"
          className="h-10 w-full rounded-xl border border-stone-200 bg-white pl-9 pr-3 text-sm text-[#181700] outline-none transition-colors placeholder:text-stone-400 focus:border-[#181700] focus:ring-4 focus:ring-[var(--hafta-ylw-100)]"
        />
      </div>
      <Select value={status} onChange={(event) => handleStatusChange(event.target.value)}>
        <option value="">Semua status</option>
        <option value="INTAKE">Intake</option>
        <option value="ACTIVE">Aktif</option>
        <option value="ON_HOLD">Ditunda</option>
        <option value="COMPLETED">Selesai</option>
        <option value="REFERRED">Rujuk</option>
      </Select>
    </div>
  );
}
