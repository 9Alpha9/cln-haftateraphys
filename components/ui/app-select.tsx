'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AppSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type AppSelectGroup = {
  label: string;
  options: AppSelectOption[];
};

type AppSelectProps = {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  options?: AppSelectOption[];
  groups?: AppSelectGroup[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  menuClassName?: string;
  size?: 'default' | 'sm' | 'compact';
  align?: 'left' | 'right';
  'aria-label'?: string;
};

export function AppSelect({
  id,
  name,
  value,
  defaultValue,
  onChange,
  options = [],
  groups,
  placeholder = 'Pilih opsi',
  disabled = false,
  required = false,
  className,
  menuClassName,
  size = 'default',
  align = 'left',
  'aria-label': ariaLabel,
}: AppSelectProps) {
  const [internalValue, setInternalValue] = useState(value ?? defaultValue ?? '');
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, bottom: 0, left: 0, width: 0, maxHeight: 280, openUp: false });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const currentValue = value !== undefined ? value : internalValue;
  const allOptions = groups?.flatMap((group) => group.options) ?? options;
  const selected = allOptions.find((option) => option.value === currentValue);

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const menuWidth = align === 'right' ? Math.max(rect.width, 192) : rect.width;
      const estimatedHeight = 280;
      const spaceBelow = window.innerHeight - rect.bottom - 12;
      const spaceAbove = rect.top - 12;
      const openUp = spaceBelow < 200 && spaceAbove > spaceBelow;
      const top = openUp ? Math.max(8, rect.top - estimatedHeight - 8) : rect.bottom + 8;
      const left =
        align === 'right'
          ? Math.max(8, rect.right - menuWidth)
          : Math.min(rect.left, window.innerWidth - menuWidth - 8);
      const maxHeight = openUp
        ? Math.min(estimatedHeight, spaceAbove)
        : Math.min(estimatedHeight, spaceBelow);

      setPosition({
        top,
        bottom: window.innerHeight - rect.top + 8,
        left,
        width: menuWidth,
        maxHeight,
        openUp,
      });
    }

    updatePosition();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (wrapperRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open, align]);

  function choose(nextValue: string) {
    if (value === undefined) setInternalValue(nextValue);
    onChange?.(nextValue);
    setOpen(false);
  }

  const menu = open
    ? createPortal(
        <div
          ref={menuRef}
          id={listboxId}
          role="listbox"
          aria-required={required || undefined}
          aria-label={ariaLabel ?? placeholder}
          style={{
            position: 'fixed',
            top: position.openUp ? 'auto' : position.top,
            bottom: position.openUp ? position.bottom : 'auto',
            left: position.left,
            width: position.width,
          }}
          className={cn(
            'z-[70] flex flex-col rounded-2xl border border-stone-200/90 bg-white p-1.5 shadow-[0_12px_32px_rgba(24,23,0,0.14)]',
            menuClassName,
          )}
        >
          <div
            className="flex min-h-0 flex-col gap-1 overflow-y-auto overscroll-contain rounded-xl p-1 pr-1.5 [scrollbar-color:#d6d3d1_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:!bg-transparent [&::-webkit-scrollbar-track-piece]:!bg-transparent [&::-webkit-scrollbar-corner]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-stone-300"
            style={{ maxHeight: Math.max(120, position.maxHeight - 12) }}
          >
            {groups
              ? groups.map((group) => (
                  <div key={group.label} className="flex flex-col gap-1">
                    <p className="px-2.5 pb-0.5 pt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">
                      {group.label}
                    </p>
                    {group.options.map((option) => (
                      <OptionButton
                        key={option.value}
                        option={option}
                        selected={option.value === currentValue}
                        onChoose={choose}
                      />
                    ))}
                  </div>
                ))
              : options.map((option) => (
                  <OptionButton
                    key={option.value}
                    option={option}
                    selected={option.value === currentValue}
                    onChoose={choose}
                  />
                ))}
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <div ref={wrapperRef} className={cn('relative w-full', className)}>
      {name ? <input type="hidden" name={name} value={currentValue} /> : null}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={ariaLabel}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'flex w-full cursor-pointer items-center justify-between gap-2 border border-stone-200/90 bg-white text-left text-[#181700] transition-colors hover:border-stone-300 focus-visible:border-[#181700] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#f7f000]/35 disabled:cursor-not-allowed disabled:opacity-60',
          size === 'sm'
            ? 'h-8 rounded-full px-3 text-[11px] font-semibold'
            : size === 'compact'
              ? 'h-9 rounded-lg px-2.5 text-xs font-semibold'
              : 'h-10 rounded-xl px-3 text-sm',
        )}
      >
        <span className={cn('min-w-0 flex-1 truncate', !selected && 'text-stone-400')}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn('h-4 w-4 shrink-0 text-stone-400 transition-transform', open && 'rotate-180')}
        />
      </button>

      {menu}
    </div>
  );
}

function OptionButton({
  option,
  selected,
  onChoose,
}: {
  option: AppSelectOption;
  selected: boolean;
  onChoose: (value: string) => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      disabled={option.disabled}
      onClick={() => onChoose(option.value)}
      className={cn(
        'flex w-full cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 sm:text-[13px]',
        selected
          ? 'border-stone-200 bg-[#F4F4F1] font-bold text-[#181700]'
          : 'border-transparent font-medium text-stone-600 hover:bg-stone-100 hover:text-[#181700]',
      )}
    >
      <span className="min-w-0 flex-1 truncate">{option.label}</span>
      {selected ? <Check className="h-3.5 w-3.5 shrink-0 text-[#181700]" /> : null}
    </button>
  );
}
