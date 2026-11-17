'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  useEffect(() => {
    if (!open) return;

    function positionPanel() {
      const trigger = triggerRef.current;
      const menu = menuRef.current;
      if (!trigger || !menu) return;

      const rect = trigger.getBoundingClientRect();
      const margin = 12;
      const bottomClearance = window.innerWidth < 1024 ? 96 : margin;
      const spaceBelow = window.innerHeight - rect.bottom - bottomClearance;
      const spaceAbove = rect.top - margin;
      const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;
      const width = Math.min(Math.max(rect.width, 232), window.innerWidth - margin * 2);
      const left =
        align === 'right'
          ? Math.max(margin, rect.right - width)
          : Math.max(margin, Math.min(rect.left, window.innerWidth - width - margin));

      const maxHeight = Math.max(180, Math.min(420, openUp ? spaceAbove : spaceBelow));

      menu.style.position = 'absolute';
      menu.style.width = `${width}px`;
      menu.style.maxHeight = `${maxHeight}px`;
      if (openUp) {
        menu.style.top = 'auto';
        menu.style.bottom = `${window.innerHeight - rect.top + 8}px`;
        menu.style.left = `${left}px`;
        menu.style.right = 'auto';
      } else {
        menu.style.bottom = 'auto';
        menu.style.top = `${rect.bottom + 8}px`;
        menu.style.left = `${left}px`;
        menu.style.right = 'auto';
      }
    }

    positionPanel();

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
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
          className={cn('h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')}
        />
      </button>

      {open ? (
        <div
          ref={menuRef}
          id={listboxId}
          role="dialog"
          aria-label={ariaLabel ?? 'Panel filter'}
          className={cn(
            'absolute z-[80] flex flex-col gap-1 overflow-y-auto overscroll-contain rounded-2xl border border-border bg-card p-1.5 shadow-[0_1px_2px_rgba(28,25,23,0.06),0_12px_32px_-16px_rgba(28,25,23,0.18)]',
            panelClassName,
          )}
        >
          {content}
        </div>
      ) : null}
    </>
  );
}