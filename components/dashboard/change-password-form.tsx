'use client';

import { useState, useTransition } from 'react';
import { KeyRound, Eye, EyeOff } from 'lucide-react';
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
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
        <div className="relative">
          <input
            type={showCurrent ? 'text' : 'password'}
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={pending}
            required
            className="flex h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowCurrent(!showCurrent)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            tabIndex={-1}
          >
            {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="space-y-3">
        <span className="text-sm font-medium">Kata sandi baru</span>
        <div className="relative">
          <input
            type={showNew ? 'text' : 'password'}
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={pending}
            required
            className="flex h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            tabIndex={-1}
          >
            {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="space-y-3">
        <span className="text-sm font-medium">Konfirmasi kata sandi baru</span>
        <div className="relative">
          <input
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={pending}
            required
            className="flex h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            tabIndex={-1}
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        <KeyRound className="h-4 w-4" aria-hidden="true" />
        {pending ? 'Menyimpan...' : 'Ubah Kata Sandi'}
      </Button>
    </form>
  );
}
