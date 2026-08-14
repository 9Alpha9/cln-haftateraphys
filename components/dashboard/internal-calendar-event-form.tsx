'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { createInternalCalendarEvent } from '@/server/actions/internal-calendar-events';

export function InternalCalendarEventForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function openPicker(e: React.MouseEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>) {
    try { e.currentTarget.showPicker(); } catch { /* ignore */ }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      try {
        await createInternalCalendarEvent({
          title: String(data.get('title') ?? ''),
          description: String(data.get('description') ?? ''),
          eventType: String(data.get('eventType') ?? 'INTERNAL_EVENT') as
            'CLINIC_CLOSURE' | 'TRAINING' | 'INTERNAL_EVENT' | 'IMPORTANT_NOTICE',
          scheduledDate: String(data.get('scheduledDate') ?? ''),
          startTime: String(data.get('startTime') ?? ''),
          endTime: String(data.get('endTime') ?? ''),
          patientVisible: data.get('patientVisible') === 'on',
        });
        router.push('/dashboard');
        router.refresh();
      } catch {
        setError('Event tidak dapat disimpan. Periksa seluruh isian.');
      }
    });
  }
  return (
    <form onSubmit={submit} className="space-y-5">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Judul event</Label>
          <Input id="title" name="title" required disabled={pending} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="eventType">Tipe</Label>
          <Select id="eventType" name="eventType" defaultValue="INTERNAL_EVENT" disabled={pending}>
            <option value="CLINIC_CLOSURE">Libur Klinik</option>
            <option value="TRAINING">Pelatihan</option>
            <option value="INTERNAL_EVENT">Kegiatan Internal</option>
            <option value="IMPORTANT_NOTICE">Pengumuman Penting</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="scheduledDate">Tanggal</Label>
          <Input id="scheduledDate" name="scheduledDate" type="date" required disabled={pending} onClick={openPicker} onFocus={openPicker} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="startTime">Mulai</Label>
            <Select id="startTime" name="startTime" disabled={pending}>
              <option value="">Pilih jam</option>
              {Array.from({ length: 24 }).map((_, h) => 
                [0, 30].map(m => {
                  const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                  return <option key={`start-${value}`} value={value}>{value}</option>;
                })
              )}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime">Selesai</Label>
            <Select id="endTime" name="endTime" disabled={pending}>
              <option value="">Pilih jam</option>
              {Array.from({ length: 24 }).map((_, h) => 
                [0, 30].map(m => {
                  const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                  return <option key={`end-${value}`} value={value}>{value}</option>;
                })
              )}
            </Select>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi</Label>
        <textarea
          id="description"
          name="description"
          disabled={pending}
          className="flex min-h-28 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <label className="flex items-start gap-3 rounded-lg border border-border p-4 text-sm">
        <input type="checkbox" name="patientVisible" className="mt-1 h-4 w-4 accent-primary" disabled={pending} />
        <span>Tampilkan event ini kepada pasien di kalender mereka.</span>
      </label>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? 'Menyimpan...' : 'Simpan Event'}
        </Button>
      </div>
    </form>
  );
}
