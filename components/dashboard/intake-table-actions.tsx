'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Archive, Eye } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { archivePatientIntake } from '@/server/actions/intake-review';
import { cn } from '@/lib/utils';

export function IntakeTableActions({ patientId, canArchive }: { patientId: string; canArchive: boolean }) {
  const [pending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  function archive() {
    startTransition(async () => {
      await archivePatientIntake(patientId);
      router.refresh();
    });
  }

  return (
    <div className="flex justify-end gap-2">
      <Link
        href={`/dashboard/patients/${patientId}/intake`}
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
      >
        <Eye /> <span className="hidden sm:inline">Buka</span>
      </Link>
      {canArchive ? (
        <>
          <Button size="sm" variant="destructive" disabled={pending} onClick={() => setShowConfirm(true)}>
            <Archive /> <span className="hidden sm:inline">Arsipkan</span>
          </Button>
          <ConfirmDialog
            isOpen={showConfirm}
            title="Arsipkan Form Awal?"
            description="Data Form Awal ini akan diarsipkan tanpa dihapus secara permanen."
            confirmLabel="Ya, Arsipkan"
            variant="destructive"
            pending={pending}
            onConfirm={archive}
            onCancel={() => setShowConfirm(false)}
          />
        </>
      ) : null}
    </div>
  );
}
