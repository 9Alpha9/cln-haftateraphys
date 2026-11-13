'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Filter, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FilterPendingBar({ active }: { active: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden transition-opacity duration-200',
        active ? 'opacity-100' : 'opacity-0',
      )}
    >
      <div
        className={cn(
          'h-full w-1/2 rounded-full bg-[var(--hafta-org-300)]',
          active && 'animate-[filter-progress_1.1s_ease-in-out_infinite]',
        )}
      />
    </div>
  );
}

type SmartFilterMenuProps = {
  label?: string;
  count?: number;
  pending?: boolean;
  disabled?: boolean;
  align?: 'left' | 'right';
  className?: string;
  panelClassName?: string;
  'aria-label'?: string;
  children: ReactNode | ((close: () => void) => ReactNode);
};

/**
 * Global filter dropdown. Renders its panel in a portal, measures available
 * space and flips above the trigger when the bottom navigation would cover it.
 */
export function SmartFilterMenu({
  label = 'Filter',
  count = 0,
  pending = false,
  disabled = false,
  align = 'right',
  className,
  panelClassName,
  'aria-label': ariaLabel,
  children,
}: SmartFilterMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    width: 260,
    maxHeight: 320,
    openUp: false,
  });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const margin = 12;
      // Keep the panel clear of the mobile bottom navigation capsule.
      const bottomClearance = window.innerWidth < 1024 ? 96 : margin;
      const spaceBelow = window.innerHeight - rect.bottom - bottomClearance;
      const spaceAbove = rect.top - margin;
      const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;
      const width = Math.min(Math.max(rect.width, 232), window.innerWidth - margin * 2);
      const left =
        align === 'right'
          ? Math.max(margin, rect.right - width)
          : Math.max(margin, Math.min(rect.left, window.innerWidth - width - margin));

      setPosition({
        top: rect.bottom + 8,
        bottom: window.innerHeight - rect.top + 8,
        left,
        width,
        maxHeight: Math.max(180, Math.min(420, openUp ? spaceAbove : spaceBelow)),
        openUp,
      });
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, align]);

  const close = () => setOpen(false);
  const content = typeof children === 'function' ? children(close) : children;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={ariaLabel ?? label}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border px-3.5 text-xs font-semibold  transition-colors focus-visible:border-[#181700] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-org-200)]/35 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:text-[13px]',
          count > 0
            ? 'border-[var(--hafta-org-200)] bg-[var(--hafta-org-50)] text-[#181700]'
            : 'border-stone-200/90 bg-white text-[#181700] hover:bg-stone-100',
          className,
        )}
      >
        {pending ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-stone-500" />
        ) : (
          <Filter className="h-4 w-4 shrink-0 text-stone-500" />
        )}
        <span>{label}</span>
        {count > 0 ? (
          <span className="rounded-full bg-[#181700] px-1.5 py-0.5 text-[10px] font-bold text-white">
            {count > 99 ? '99+' : count}
          </span>
        ) : null}
        <ChevronDown
          aria-hidden="true"
          className={cn('h-3.5 w-3.5 shrink-0 text-stone-400 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open
        ? createPortal(
            <div
              ref={menuRef}
              id={listboxId}
              role="dialog"
              aria-label={ariaLabel ?? 'Panel filter'}
              style={{
                position: 'fixed',
                top: position.openUp ? 'auto' : position.top,
                bottom: position.openUp ? position.bottom : 'auto',
                left: position.left,
                width: position.width,
                maxHeight: position.maxHeight,
              }}
              className={cn(
                'z-[80] flex flex-col gap-1 overflow-y-auto overscroll-contain rounded-2xl border border-stone-200/90 bg-white p-2 -[0_12px_32px_rgba(24,23,0,0.14)]',
                panelClassName,
              )}
            >
              {content}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
