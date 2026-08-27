'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { createUser } from '@/server/actions/create-user';

const STAFF_ROLES = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'THERAPIST', label: 'Terapis' },
  { value: 'STAFF', label: 'Staff' },
  { value: 'USER', label: 'Pasien' },
] as const;

export function CreateUserForm({ canCreateStaffAccounts }: { canCreateStaffAccounts: boolean }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { showToast } = useToast();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        const result = await createUser({
          name: String(formData.get('name') ?? ''),
          email: String(formData.get('email') ?? ''),
          phone: String(formData.get('phone') ?? '') || undefined,
          password: String(formData.get('password') ?? ''),
          role: String(formData.get('role') ?? 'USER') as 'ADMIN' | 'THERAPIST' | 'STAFF' | 'USER',
        });

        if (result.ok) {
          showToast('success', 'Akun pengguna berhasil dibuat.');
          router.push(canCreateStaffAccounts ? '/dashboard/users' : '/dashboard/patients');
          router.refresh();
        } else {
          showToast('error', result.error);
        }
      } catch {
        showToast('error', 'Gagal membuat akun pengguna. Silakan coba lagi.');
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nama Lengkap</Label>
          <Input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Masukkan nama lengkap"
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="contoh@email.com"
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={12}
            placeholder="Minimal 12 karakter"
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telepon (opsional)</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="08xxxxxxxxxx"
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select id="role" name="role" required defaultValue="USER" disabled={pending}>
            {STAFF_ROLES.filter((role) => canCreateStaffAccounts || role.value === 'USER').map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={pending}>
          Batal
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? 'Membuat...' : 'Buat Akun'}
        </Button>
      </div>
    </form>
  );
}
