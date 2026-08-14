'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { deleteUser } from '@/server/actions/delete-user';

interface DeleteUserButtonProps {
  userId: string;
  userName: string;
  disabled?: boolean;
}

export function DeleteUserButton({ userId, userName, disabled = false }: DeleteUserButtonProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleConfirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteUser({ userId });
      if (result.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive"
        disabled={disabled}
        onClick={() => setOpen(true)}
        aria-label={`Hapus akun ${userName}`}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus akun permanen?</DialogTitle>
            <DialogDescription>
              Seluruh data milik <span className="font-semibold">{userName}</span> (rekam pasien, janji temu, home
              program, dan lainnya) akan dihapus permanen dan tidak dapat dipulihkan.
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleConfirm} disabled={pending}>
              {pending ? 'Menghapus...' : 'Hapus permanen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
