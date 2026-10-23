'use client';

import React, { useState, useEffect, useRef, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, User, Calendar, Users, FileText, ArrowRight, X } from 'lucide-react';
import { searchGlobalEntities, type SearchResultItem } from '@/server/actions/global-search';
import { cn } from '@/lib/utils';
import type { Role } from '@/lib/permissions/roles';

export function DashboardGlobalSearch({ role }: { role: Role }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const trimmedQuery = useMemo(() => query.trim(), [query]);
  const activeResults = trimmedQuery ? results : [];

  // Shortcut ⌘K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Klik di luar untuk menutup dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!trimmedQuery) return;

    const timer = setTimeout(() => {
      startTransition(async () => {
        try {
          const res = await searchGlobalEntities(trimmedQuery);
          setResults(res);
        } catch {
          setResults([]);
        }
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [trimmedQuery]);

  const handleSelect = (href: string) => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
    router.push(href);
  };

  const getCategoryIcon = (category: SearchResultItem['category']) => {
    switch (category) {
      case 'Pasien':
        return <User className="h-4 w-4 text-emerald-600" />;
      case 'Jadwal':
        return <Calendar className="h-4 w-4 text-[var(--hafta-ylw-700)]" />;
      case 'Rekam Medis':
        return <FileText className="h-4 w-4 text-[var(--hafta-grn-600)]" />;
      case 'Pengguna':
        return <Users className="h-4 w-4 text-blue-600" />;
      default:
        return <FileText className="h-4 w-4 text-stone-500" />;
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md hidden md:block">
      {/* Search Input Bar */}
      <div
        className={cn(
          'flex items-center gap-2.5 rounded-xl border bg-[#F7FAF8] px-3.5 py-2 transition-all',
          isOpen
            ? 'border-[#181700] bg-white ring-2 ring-[#f7f000]/30 shadow-sm'
            : 'border-stone-200 hover:border-stone-300'
        )}
      >
        <Search className="h-4 w-4 text-stone-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={role === 'USER' ? 'Cari jadwal sesi, catatan terapi, atau panduan latihan...' : 'Cari pasien, jadwal, atau modul...'}
          className="flex-1 bg-transparent text-xs sm:text-[13px] text-[#181700] placeholder:text-stone-400 outline-none"
        />
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-stone-400 shrink-0" />
        ) : query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="text-stone-400 hover:text-stone-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-stone-200 bg-white px-1.5 font-mono text-[10px] font-semibold text-stone-500 shadow-2xs">
            ⌘K
          </kbd>
        )}
      </div>

      {/* Floating Dropdown Modal */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl animate-in fade-in-50 duration-150">
          <div className="p-2 max-h-[360px] overflow-y-auto divide-y divide-stone-100">
            {trimmedQuery.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-stone-400">
                {role === 'USER'
                  ? 'Cari jadwal sesi, catatan terapi final, atau pengaturan akun...'
                  : 'Ketik nama pasien, jadwal terapi, atau modul sistem...'}
              </div>
            ) : isPending ? (
              <div className="flex items-center justify-center py-6 gap-2 text-xs text-stone-500">
                <Loader2 className="h-4 w-4 animate-spin text-[#181700]" />
                <span>Mencari data...</span>
              </div>
            ) : activeResults.length === 0 ? (
              <div className="px-3 py-5 text-center text-xs text-stone-500">
                Tidak ada data yang sesuai dengan kata kunci &ldquo;{query}&rdquo;.
              </div>
            ) : (
              activeResults.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.href)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-stone-50 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-100">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-xs font-bold text-[#181700] sm:text-sm">{item.title}</p>
                        <span className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-stone-500">
                          {item.category}
                        </span>
                      </div>
                      <p className="truncate text-[11px] text-stone-500">{item.subtitle}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-stone-300" />
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
