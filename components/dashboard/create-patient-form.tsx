'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { createPatientFromUser } from '@/server/actions/patients';

type UserOption = { id: string; name: string | null; email: string };

export function CreatePatientForm({ userOptions }: { userOptions: UserOption[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const userId = String(new FormData(event.currentTarget).get('userId') ?? '');
    setError(null);
    startTransition(async () => {
      try {
        await createPatientFromUser(userId);
        router.push('/dashboard/patients');
        router.refresh();
      } catch {
        setError('Pasien tidak dapat ditambahkan. Pilih akun USER yang belum terhubung.');
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
      <div className="space-y-2">
        <Label htmlFor="userId">Akun pasien</Label>
        <Select id="userId" name="userId" required disabled={pending || userOptions.length === 0}>
          <option value="">Pilih akun pasien</option>
          {userOptions.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name || 'Tanpa nama'} · {user.email}
            </option>
          ))}
        </Select>
        {userOptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Semua akun USER sudah memiliki record pasien, atau belum ada akun USER.
          </p>
        ) : null}
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending || userOptions.length === 0}>
          {pending ? 'Menambahkan...' : 'Tambah Pasien'}
        </Button>
      </div>
    </form>
  );
}
