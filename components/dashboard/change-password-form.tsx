'use client';

import { useState, useTransition } from 'react';
import { KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth/client';
import { notifyPasswordChanged } from '@/server/actions/security';

export function ChangePasswordForm() {
  const [pending, startTransition] = useTransition();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  function submit(event: React.FormEvent) {
    event.preventDefault();

    if (newPassword.length < 8) {
      toast.error('Kata sandi baru minimal 8 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    startTransition(async () => {
      try {
        const result = await authClient.changePassword({
          currentPassword,
          newPassword,
          revokeOtherSessions: true,
        });
        if (result.error) {
          toast.error(result.error.message ?? 'Gagal mengubah kata sandi.');
          return;
        }
        await notifyPasswordChanged();
        toast.success('Kata sandi berhasil diubah.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } catch {
        toast.error('Kata sandi tidak dapat diubah saat ini. Coba lagi nanti.');
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4" data-testid="change-password-form">
      <div className="space-y-3">
        <span className="text-sm font-medium">Kata sandi saat ini</span>
        <Input
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          disabled={pending}
          required
        />
      </div>
      <div className="space-y-3">
        <span className="text-sm font-medium">Kata sandi baru</span>
        <Input
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={pending}
          required
        />
      </div>
      <div className="space-y-3">
        <span className="text-sm font-medium">Konfirmasi kata sandi baru</span>
        <Input
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={pending}
          required
        />
      </div>
      <Button type="submit" disabled={pending}>
        <KeyRound className="h-4 w-4" aria-hidden="true" />
        {pending ? 'Menyimpan...' : 'Ubah Kata Sandi'}
      </Button>
    </form>
  );
}
