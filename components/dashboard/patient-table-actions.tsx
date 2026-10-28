'use client';

import { useState, useTransition, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Archive, Eye, MoreVertical } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { archivePatient } from '@/server/actions/patients';
import { PatientDetailDrawer } from '@/components/dashboard/patients/patient-detail-drawer';
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
  const [showDetail, setShowDetail] = useState(false);
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
    return () => {
      window.removeEventListener('keydown', handleEscape);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [closeMenu]);

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
        className="w-9 h-9 min-w-[36px] min-h-[36px] aspect-square p-0 rounded-full bg-white hover:bg-stone-100 text-[#181700] border border-stone-200/90 inline-flex items-center justify-center shrink-0 cursor-pointer transition-all focus-visible:outline-none focus-visible:border-[#181700] focus-visible:ring-4 focus-visible:ring-[#f7f000]/35 gap-0 px-0"
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
            'z-[60] rounded-2xl bg-white shadow-[0_12px_32px_rgba(24,23,0,0.14)] p-1.5 flex flex-col gap-0.5',
            menuPosition.direction === 'top' ? 'origin-bottom-right' : 'origin-top-right',
          )}
        >
          <button
            type="button"
            onClick={() => {
              closeMenu();
              setShowDetail(true);
            }}
            className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-semibold text-[#181700] bg-transparent hover:bg-stone-100 flex items-center gap-3 cursor-pointer transition-colors text-left rounded-xl justify-start"
          >
            <Eye className="w-4 h-4 shrink-0 text-stone-600" />
            <span className="truncate">Lihat Detail</span>
          </button>
          {canArchive ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                closeMenu();
                setShowConfirm(true);
              }}
              className="group w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-semibold text-[#181700] bg-transparent hover:bg-red-600 hover:text-white flex items-center gap-3 cursor-pointer transition-colors text-left rounded-xl justify-start"
            >
              <Archive className="w-4 h-4 shrink-0 text-stone-600 transition-colors group-hover:text-white" />
              <span className="truncate transition-colors group-hover:text-white">Arsipkan</span>
            </button>
          ) : null}
        </div>,
        document.body,
      )}

      <PatientDetailDrawer isOpen={showDetail} onClose={() => setShowDetail(false)} patientId={patientId} />
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