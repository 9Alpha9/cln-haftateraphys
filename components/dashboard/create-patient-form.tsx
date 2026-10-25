'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { GlobalSlideOver } from '@/components/ui/global-slide-over';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { createPatientFromUser } from '@/server/actions/patients';

type UserOption = { id: string; name: string | null; email: string };

export function CreatePatientForm({
  userOptions,
  isOpen,
  onClose,
  onSaved,
}: {
  userOptions: UserOption[];
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [pendingSubmit, setPendingSubmit] = useState(false);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const userId = String(new FormData(event.currentTarget).get('userId') ?? '');
    setError(null);
    setPendingSubmit(true);
    startTransition(async () => {
      try {
        await createPatientFromUser(userId);
        router.refresh();
        onSaved?.();
        onClose();
      } catch {
        setError('Pasien tidak dapat ditambahkan. Pilih akun USER yang belum terhubung.');
      } finally {
        setPendingSubmit(false);
      }
    });
  }

  return (
    <GlobalSlideOver
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      icon={null}
      title="Daftarkan Pasien"
      subtitle="Pilih akun USER yang belum terhubung agar dibuatkan record pasien."
      footer={
        <div className="flex items-center justify-between gap-3">
          <button
            type="submit"
            form="create-patient-form"
            disabled={pendingSubmit || pending || userOptions.length === 0}
            className="h-10 sm:h-11 px-5 rounded-full bg-[var(--hafta-ylw-100)] hover:bg-[var(--hafta-ylw-200)] text-[#181700] font-bold text-xs sm:text-[13px] inline-flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-all whitespace-nowrap shrink-0"
          >
            {pendingSubmit || pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Simpan & Daftarkan
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-10 sm:h-11 px-5 rounded-full bg-white hover:bg-stone-100 text-[#181700] border border-stone-200/90 font-semibold text-xs sm:text-[13px] inline-flex items-center justify-center gap-2 cursor-pointer transition-all whitespace-nowrap shrink-0"
          >
            Batal
          </button>
        </div>
      }
    >
      <form id="create-patient-form" onSubmit={submit} className="space-y-5">
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
      </form>
    </GlobalSlideOver>
  );
}
