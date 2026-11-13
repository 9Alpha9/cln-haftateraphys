'use client';

import { useState, useTransition, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Archive, MoreVertical } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { archivePatient } from '@/server/actions/patients';
import { cn } from '@/lib/utils';

export function PatientTableActions({
  patientId,
  canArchive,
  rowIndex,
  totalRows,
  openRowId,
  setOpenRowId,
}: {
  patientId: string;
  canArchive: boolean;
  rowIndex: number;
  totalRows: number;
  openRowId: string | null;
  setOpenRowId: (id: string | null) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 176, direction: 'bottom' as 'top' | 'bottom' });
  const router = useRouter();
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isMenuOpen = openRowId === patientId;

  function archive() {
    startTransition(async () => {
      try {
        await archivePatient(patientId);
        toast.success("Pasien diarsipkan", {
          action: {
            label: "Lihat arsip",
            onClick: () => router.push("/dashboard/patients/archived"),
          },
        });
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal mengarsipkan pasien.");
      } finally {
        setShowConfirm(false);
      }
    });
  }

  const openMenu = useCallback(() => {
    const trigger = triggerRef.current;
    if (trigger) {
      const rect = trigger.getBoundingClientRect();
      const menuWidth = 176; // w-44
      const menuHeight = 110;
      const gap = 8;
      const spaceBelow = window.innerHeight - rect.bottom - gap;
      const spaceAbove = rect.top - gap;
      const direction = spaceBelow < menuHeight && spaceAbove >= spaceBelow ? 'top' : 'bottom';

      // Align the menu's right edge with the trigger, then clamp inside the viewport
      let left = rect.right - menuWidth;
      left = Math.min(left, window.innerWidth - menuWidth - gap);
      left = Math.max(left, gap);

      const top = direction === 'top' ? rect.top - gap : rect.bottom + gap;

      setMenuPosition({ top, left, width: menuWidth, direction });
    }
    setOpenRowId(patientId);
  }, [patientId, setOpenRowId]);

  const closeMenu = useCallback(() => {
    setOpenRowId(null);
  }, [setOpenRowId]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) && triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    window.addEventListener('keydown', handleEscape);
    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', closeMenu, true);
    window.addEventListener('resize', closeMenu);
    return () => {
      window.removeEventListener('keydown', handleEscape);
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', closeMenu, true);
      window.removeEventListener('resize', closeMenu);
    };
  }, [closeMenu]);

  if (!canArchive) return null;

  return (
    <div className="relative inline-flex shrink-0" ref={triggerRef}>
      <button
        type="button"
        aria-expanded={isMenuOpen}
        aria-haspopup="menu"
        onClick={() => {
          if (isMenuOpen) {
            closeMenu();
          } else {
            openMenu();
          }
        }}
        className="h-10 w-10 min-w-[40px] min-h-[40px] aspect-square p-0 rounded-full border border-stone-200/90 bg-white text-[#181700] inline-flex shrink-0 cursor-pointer items-center justify-center gap-0 transition-all hover:bg-stone-100 focus-visible:outline-none focus-visible:border-[#181700] focus-visible:ring-4 focus-visible:ring-[var(--hafta-org-200)]/35"
      >
        <MoreVertical className="w-4 h-4 shrink-0 text-[#181700]" />
      </button>

      {isMenuOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          role="menu"
          style={{
            position: 'fixed',
            left: menuPosition.left,
            width: menuPosition.width,
            top: menuPosition.top,
            transform: menuPosition.direction === 'top' ? 'translateY(-100%)' : undefined,
          }}
          className={cn(
            'z-20 flex flex-col gap-1 rounded-2xl border border-stone-200/90 bg-white p-2 shadow-[0_12px_32px_rgba(24,23,0,0.14)]',
            menuPosition.direction === 'top' ? 'origin-bottom-right' : 'origin-top-right',
          )}
        >
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              closeMenu();
              setShowConfirm(true);
            }}
            className="group w-full rounded-xl px-3.5 py-2.5 text-left text-xs font-semibold text-[#181700] bg-transparent hover:bg-red-600 hover:text-white flex items-center gap-3 cursor-pointer transition-colors justify-start sm:text-[13px]"
          >
            <Archive className="w-4 h-4 shrink-0 text-stone-600 transition-colors group-hover:text-white" />
            <span className="truncate transition-colors group-hover:text-white">Arsipkan Pasien</span>
          </button>
        </div>,
        document.body,
      )}

      {canArchive && (
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
      )}
    </div>
  );
}