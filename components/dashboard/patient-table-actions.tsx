'use client';

import { useState, useTransition, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
      await archivePatient(patientId);
      router.refresh();
    });
  }

  const openMenu = useCallback(() => {
    const trigger = triggerRef.current;
    if (trigger) {
      const rect = trigger.getBoundingClientRect();
      const menuWidth = 176; // w-44
      const menuHeight = 110;
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const spaceAbove = rect.top - 8;
      const direction = spaceBelow < menuHeight && spaceAbove >= spaceBelow ? 'top' : 'bottom';

      // Smart horizontal clamping: keep menu within viewport
      let left = rect.left;
      if (left + menuWidth > window.innerWidth - 8) {
        left = window.innerWidth - menuWidth - 8;
      }
      if (left < 8) left = 8;

      setMenuPosition({
        top: rect.top,
        left,
        width: menuWidth,
        direction,
      });
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

      {isMenuOpen && (
        <div
          ref={menuRef}
          className={cn(
            "fixed z-50 w-44 rounded-2xl bg-white shadow-[0_12px_32px_rgba(24,23,0,0.14)] p-1.5 flex flex-col gap-0.5",
            menuPosition.direction === 'top'
              ? `bottom-[calc(100%+8px)] right-[calc(100vw-${menuPosition.left}-${menuPosition.width}px)] origin-bottom-right`
              : `top-[${menuPosition.top}px] right-[calc(100vw-${menuPosition.left}-${menuPosition.width}px)] mt-1.5 origin-top-right`,
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
              className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-semibold text-[#181700] bg-transparent hover:bg-[var(--hafta-ylw-50)] flex items-center gap-3 cursor-pointer transition-colors text-left rounded-xl justify-start"
            >
              <Archive className="w-4 h-4 shrink-0 text-stone-600" />
              <span className="truncate">Arsipkan</span>
            </button>
          ) : null}
        </div>
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
          onCancel={closeMenu}
        />
      )}
    </div>
  );
}
