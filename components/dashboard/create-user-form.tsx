'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
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
          username: String(formData.get('username') ?? '') || undefined,
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
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={12}
              placeholder="Minimal 12 karakter"
              disabled={pending}
              className="flex h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
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
          <Label htmlFor="username">Username (opsional)</Label>
          <Input
            id="username"
            name="username"
            type="text"
            placeholder="username untuk login"
            minLength={3}
            maxLength={30}
            disabled={pending}
          />
          <p className="text-[11px] text-muted-foreground">Bisa digunakan untuk login selain email.</p>
        </div>
        {canCreateStaffAccounts ? (
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select id="role" name="role" required defaultValue="USER" disabled={pending}>
              {STAFF_ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </Select>
          </div>
        ) : (
          <input type="hidden" name="role" value="USER" />
        )}
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
