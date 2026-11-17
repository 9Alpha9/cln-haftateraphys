'use client';

import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { useEffect, useRef, useState, type ReactNode } from 'react';
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
  /** Optional selector of an element (e.g. a sticky header) that must not be covered by the panel. */
  avoidSelector?: string;
  children: ReactNode | ((close: () => void) => ReactNode);
};

export function SmartFilterMenu({
  label = 'Filter',
  count = 0,
  pending = false,
  disabled = false,
  align = 'right',
  className,
  panelClassName,
  'aria-label': ariaLabel,
  avoidSelector,
  children,
}: SmartFilterMenuProps) {
  const [open, setOpen] = useState(false);
  const [sideOffset, setSideOffset] = useState(8);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = () => setOpen(false);
  const content = typeof children === 'function' ? children(close) : children;

  // Close the menu whenever an overlay (slide-over) opens, so it can never
  // float on top of, or stay open behind, a drawer.
  useEffect(() => {
    const handleOverlayOpen = () => setOpen(false);
    window.addEventListener('hafta:overlay-open', handleOverlayOpen);
    return () => window.removeEventListener('hafta:overlay-open', handleOverlayOpen);
  }, []);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) return;
    let offset = 8;
    if (avoidSelector) {
      const avoid = document.querySelector(avoidSelector);
      const trigger = triggerRef.current;
      if (avoid && trigger) {
        const triggerRect = trigger.getBoundingClientRect();
        const avoidRect = avoid.getBoundingClientRect();
        if (avoidRect.top >= triggerRect.bottom - 1) {
          offset = Math.max(offset, Math.round(avoidRect.bottom - triggerRect.bottom) + 8);
        }
      }
    }
    setSideOffset(offset);
  }

  return (
    <DropdownMenuPrimitive.Root open={open} onOpenChange={handleOpenChange} modal={false}>
      <DropdownMenuPrimitive.Trigger asChild disabled={disabled}>
        <button
          ref={triggerRef}
          type="button"
          aria-label={ariaLabel ?? label}
          className={cn(
            'inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border px-3.5 text-xs font-semibold transition-colors focus-visible:border-[var(--hafta-950)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:text-[13px]',
            count > 0
              ? 'border-[var(--hafta-200)] bg-[var(--hafta-50)] text-foreground'
              : 'border-border bg-card text-foreground hover:bg-accent',
            className,
          )}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span>{label}</span>
          {count > 0 ? (
            <span className="rounded-full bg-[var(--hafta-900)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--hafta-50)]">
              {count > 99 ? '99+' : count}
            </span>
          ) : null}
          <ChevronDown
            aria-hidden="true"
            className={cn(
              'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform',
              open && 'rotate-180',
            )}
          />
        </button>
      </DropdownMenuPrimitive.Trigger>

      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align={align === 'right' ? 'end' : 'start'}
          sideOffset={sideOffset}
          collisionPadding={12}
          className={cn(
            // z-[70] keeps the panel above slide-overs (z-60), matching AppSelect,
            // so it also works inside drawers. Menus auto-close when an overlay opens.
            'z-[70] flex max-h-[min(420px,calc(100dvh-4rem))] min-w-[232px] flex-col gap-1 overflow-y-auto overscroll-contain rounded-2xl border border-border bg-card p-1.5 text-popover-foreground shadow-[0_1px_2px_rgba(28,25,23,0.06),0_12px_32px_-16px_rgba(28,25,23,0.18)] outline-none',
            panelClassName,
          )}
        >
          {content}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}