'use client';

import { useState, useTransition } from 'react';
import { KeyRound } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth/client';
import { notifyPasswordChanged } from '@/server/actions/security';

export function ChangePasswordForm() {
  const [pending, startTransition] = useTransition();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < 8) {
      setError('Kata sandi baru minimal 8 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
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
          setError(result.error.message ?? 'Gagal mengubah kata sandi.');
          return;
        }
        await notifyPasswordChanged();
        setSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } catch {
        setError('Kata sandi tidak dapat diubah saat ini. Coba lagi nanti.');
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4" data-testid="change-password-form">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert variant="default">
          <AlertDescription>Kata sandi berhasil diubah.</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="current-password">Kata sandi saat ini</Label>
        <Input
          id="current-password"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          disabled={pending}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-password">Kata sandi baru</Label>
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={pending}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Konfirmasi kata sandi baru</Label>
        <Input
          id="confirm-password"
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
