'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronRight, Circle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { cn } from '@/lib/utils';

const DropdownMenuContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
} | null>(null);

function useDropdownMenu() {
  const context = React.useContext(DropdownMenuContext);
  if (!context) throw new Error('Dropdown menu components must be nested in DropdownMenu.');
  return context;
}

function DropdownMenu({
  children,
  open: openProp,
  onOpenChange,
}: {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = openProp ?? internalOpen;
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const setOpen = React.useCallback(
    (value: boolean) => {
      setInternalOpen(value);
      onOpenChange?.(value);
    },
    [onOpenChange]
  );

  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) setOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, setOpen]);

  // Close when clicking/tapping outside the trigger and the content
  React.useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target)) return;
      if (contentRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open, setOpen, triggerRef, contentRef]);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen, triggerRef, contentRef }}>
      {children}
    </DropdownMenuContext.Provider>
  );
}

function DropdownMenuTrigger({ className, children, ...props }: React.ComponentProps<'button'>) {
  const { open, setOpen, triggerRef } = useDropdownMenu();
  return (
    <button
      ref={triggerRef}
      type="button"
      aria-expanded={open}
      className={cn("cursor-pointer", className)}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children}
    </button>
  );
}

function DropdownMenuContent({ className, children, align = "end" }: React.ComponentProps<'div'> & { align?: "start" | "end" }) {
  const { open, setOpen, triggerRef, contentRef } = useDropdownMenu();
  const [position, setPosition] = React.useState({ top: 0, left: 0, right: 0 });

  React.useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8, // mt-2
        left: rect.left,
        right: window.innerWidth - rect.right,
      });
    }
  }, [open, triggerRef]);

  const content = (
    <motion.div
      ref={contentRef}
      key="menu"
      role="menu"
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      style={{
        position: 'fixed',
        top: position.top,
        ...(align === "end" ? { right: position.right } : { left: position.left }),
      }}
      className={cn(
        'z-[70] min-w-48 overflow-hidden rounded-lg border border-border bg-white p-1.5 text-popover-foreground shadow-lg',
        className,
      )}
    >
      {children}
    </motion.div>
  );

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && content}
    </AnimatePresence>,
    document.body
  );
}

function DropdownMenuItem({ className, onClick, ...props }: React.ComponentProps<'button'>) {
  const { setOpen } = useDropdownMenu();
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        "flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm outline-none transition-colors hover:bg-muted focus-visible:bg-muted disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg]:stroke-[2.2]",
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        setOpen(false);
      }}
      {...props}
    />
  );
}

function DropdownMenuLabel({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      className={cn('px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground', className)}
      {...props}
    />
  );
}

function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('my-1.5 h-px bg-border', className)} {...props} />;
}

function DropdownMenuCheckboxItem({
  checked,
  children,
  className,
  onClick,
  ...props
}: React.ComponentProps<'button'> & { checked?: boolean }) {
  return (
    <DropdownMenuItem className={cn('gap-3', className)} onClick={onClick} {...props}>
      <span className="flex h-4 w-4 items-center justify-center">{checked ? <Check className="h-4 w-4" /> : null}</span>
      {children}
    </DropdownMenuItem>
  );
}

function DropdownMenuRadioItem({
  checked,
  children,
  className,
  onClick,
  ...props
}: React.ComponentProps<'button'> & { checked?: boolean }) {
  return (
    <DropdownMenuItem className={cn('gap-3', className)} onClick={onClick} {...props}>
      <span className="flex h-4 w-4 items-center justify-center">
        {checked ? <Circle className="h-2.5 w-2.5 fill-current" /> : null}
      </span>
      {children}
    </DropdownMenuItem>
  );
}

function DropdownMenuSubTrigger({ children, className, ...props }: React.ComponentProps<'button'>) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2.5 text-sm hover:bg-muted',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto h-4 w-4" />
    </button>
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSubTrigger,
};
