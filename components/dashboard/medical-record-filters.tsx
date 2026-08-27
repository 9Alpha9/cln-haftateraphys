'use client';

import { useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

export function MedicalRecordFilters({
  initialSearch = '',
  initialStatus = '',
  initialVisible = '',
}: {
  initialSearch?: string;
  initialStatus?: string;
  initialVisible?: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', '1');
      
      const q = String(formData.get('q') ?? '').trim();
      if (q) params.set('q', q);
      else params.delete('q');

      const status = String(formData.get('status') ?? '');
      if (status) params.set('status', status);
      else params.delete('status');

      const visible = String(formData.get('visible') ?? '');
      if (visible) params.set('visible', visible);
      else params.delete('visible');

      router.push(`/dashboard/progress?${params.toString()}`);
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-[1fr_10rem_10rem_auto]">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          name="q"
          type="text"
          defaultValue={initialSearch}
          disabled={pending}
          placeholder="Cari nama pasien..."
          className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        />
      </div>
      <Select name="status" defaultValue={initialStatus} disabled={pending}>
        <option value="">Semua Status</option>
        <option value="DRAFT">Draft</option>
        <option value="FINALIZED">Final</option>
      </Select>
      <Select name="visible" defaultValue={initialVisible} disabled={pending}>
        <option value="">Semua Akses</option>
        <option value="true">Pasien</option>
        <option value="false">Internal</option>
      </Select>
      <Button type="submit" disabled={pending} className="min-w-[5rem]">
        {pending ? (
          <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          'Cari'
        )}
      </Button>
    </form>
  );
}
