'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { setUserSuspension } from '@/server/actions/user-suspension';
import { cn } from '@/lib/utils';

export function UserSuspensionButton({
  userId,
  userName,
  suspended,
  disabled,
}: {
  userId: string;
  userName: string;
  suspended: boolean;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function apply() {
    startTransition(async () => {
      const result = await setUserSuspension({ userId, suspend: !suspended });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(suspended ? 'Akun berhasil diaktifkan kembali.' : 'Akun berhasil ditangguhkan.');
      setConfirmOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        disabled={pending || disabled}
        onClick={() => setConfirmOpen(true)}
        title={disabled ? 'Tidak dapat mengubah status akun sendiri' : undefined}
        className={cn(
          'inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
          suspended
            ? 'border-[var(--hafta-grn-200)] bg-white text-[var(--hafta-grn-700)] hover:bg-[var(--hafta-grn-50)]'
            : 'border-red-200 bg-white text-red-700 hover:bg-red-50',
        )}
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : suspended ? (
          <ShieldCheck className="h-3.5 w-3.5" />
        ) : (
          <ShieldOff className="h-3.5 w-3.5" />
        )}
        {pending ? 'Memproses…' : suspended ? 'Aktifkan' : 'Tangguhkan'}
      </button>

      <ConfirmDialog
        isOpen={confirmOpen}
        title={suspended ? `Aktifkan kembali ${userName}?` : `Tangguhkan ${userName}?`}
        description={
          suspended
            ? 'Akun akan dapat masuk kembali dan mengakses data sesuai rolenya.'
            : 'Akun tidak dapat masuk dan seluruh sesi aktifnya akan dicabut. Data klinis dan riwayat akun tetap tersimpan.'
        }
        confirmLabel={suspended ? 'Ya, Aktifkan' : 'Ya, Tangguhkan'}
        cancelLabel="Batal"
        variant={suspended ? 'default' : 'destructive'}
        pending={pending}
        onConfirm={apply}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
