'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Archive, MoreVertical } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { archivePatient } from '@/server/actions/patients';

export function PatientTableActions({
  patientId,
  patientName,
  canArchive,
  openRowId,
  setOpenRowId,
}: {
  patientId: string;
  patientName: string;
  canArchive: boolean;
  rowIndex: number;
  totalRows: number;
  openRowId: string | null;
  setOpenRowId: (id: string | null) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const isMenuOpen = openRowId === patientId;

  function archive() {
    startTransition(async () => {
      try {
        await archivePatient(patientId);
        toast.success('Pasien diarsipkan', {
          action: {
            label: 'Lihat arsip',
            onClick: () => router.push('/dashboard/patients/archived'),
          },
        });
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Gagal mengarsipkan pasien.');
      } finally {
        setShowConfirm(false);
      }
    });
  }

  if (!canArchive) return null;

  return (
    <>
      <DropdownMenu open={isMenuOpen} onOpenChange={(next) => setOpenRowId(next ? patientId : null)}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={patientName ? `Aksi untuk ${patientName}` : 'Aksi pasien'}
            className="inline-flex h-10 min-h-[40px] w-10 min-w-[40px] shrink-0 aspect-square cursor-pointer items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-accent focus-visible:border-[var(--hafta-950)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
          >
            <MoreVertical className="h-4 w-4 shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={6} className="w-44 p-2">
          <DropdownMenuItem
            disabled={pending}
            onSelect={() => setShowConfirm(true)}
            className="group gap-3 font-semibold focus:bg-red-600 focus:text-white"
          >
            <Archive className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-white group-focus:text-white" />
            <span className="truncate">Arsipkan Pasien</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        isOpen={showConfirm}
        title="Arsipkan Pasien?"
        description="Data klinis pasien ini tidak akan dihapus dan masih dapat diakses melalui filter riwayat."
        confirmLabel="Ya, Arsipkan"
        variant="destructive"
        pending={pending}
        onConfirm={archive}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
