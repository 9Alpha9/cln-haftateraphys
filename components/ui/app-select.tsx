'use client';

import { useState } from 'react';
import { Select as SelectPrimitive } from '@base-ui/react/select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TOPBAR_SAFE_AREA_PX, useResponsiveCollisionPadding } from '@/components/ui/overlay-positioning';

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
  /** Pesan saat tidak ada opsi sama sekali (mis. belum ada pasien terhubung). */
  emptyMessage?: string;
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
  emptyMessage = 'Tidak ada opsi tersedia.',
  'aria-label': ariaLabel,
}: AppSelectProps) {
  const allOptions = groups?.flatMap((group) => group.options) ?? options;
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;
  const selected = allOptions.find((option) => option.value === currentValue);
  const collisionPadding = useResponsiveCollisionPadding(TOPBAR_SAFE_AREA_PX);

  return (
    <div className={cn('relative w-full', className)}>
      <SelectPrimitive.Root
        value={currentValue || null}
        onValueChange={(next) => {
          const nextValue = next == null ? '' : String(next);
          if (!isControlled) setInternalValue(nextValue);
          onChange?.(nextValue);
        }}
        name={name}
        required={required}
        disabled={disabled}
        modal={false}
      >
        <SelectPrimitive.Trigger
          id={id}
          aria-label={ariaLabel}
          className={cn(
            'group flex w-full cursor-pointer items-center justify-between gap-2 border border-stone-200/90 bg-white text-left text-[#181700] transition-colors hover:border-stone-300 focus-visible:border-[var(--hafta-950)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35 disabled:cursor-not-allowed disabled:opacity-60',
            size === 'sm'
              ? 'h-8 rounded-full px-3 text-[11px] font-semibold'
              : size === 'compact'
                ? 'h-9 rounded-lg px-2.5 text-xs font-semibold'
                : 'h-11 rounded-xl px-3 text-sm',
          )}
        >
          <span className={cn('min-w-0 flex-1 truncate', !selected && 'text-stone-400')}>
            {selected?.label ?? placeholder}
          </span>
          <SelectPrimitive.Icon>
            <ChevronDown
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-stone-400 transition-transform group-data-[popup-open]:rotate-180"
            />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Positioner
            className="isolate z-[70] outline-none"
            align={align === 'right' ? 'end' : 'start'}
            side="bottom"
            sideOffset={6}
            collisionPadding={collisionPadding}
          >
            <SelectPrimitive.Popup
              data-slot="app-select-content"
              className={cn(
                'z-[70] max-h-[min(280px,var(--available-height))] w-(--anchor-width) min-w-(--anchor-width) origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-2xl border border-stone-200/90 bg-white p-1.5 text-[#181700] shadow-[0_12px_32px_rgba(24,23,0,0.14)] outline-none data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 duration-100',
                menuClassName,
              )}
            >
              <SelectPrimitive.List className="flex flex-col gap-1">
                {allOptions.length === 0 ? (
                  <p className="px-3 py-2.5 text-xs leading-relaxed text-stone-500">{emptyMessage}</p>
                ) : null}
                {groups
                  ? groups.map((group) => (
                      <SelectPrimitive.Group key={group.label} className="flex flex-col gap-1">
                        <SelectPrimitive.GroupLabel className="px-2.5 pb-0.5 pt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">
                          {group.label}
                        </SelectPrimitive.GroupLabel>
                        {group.options.map((option) => (
                          <OptionItem key={option.value} option={option} />
                        ))}
                      </SelectPrimitive.Group>
                    ))
                  : options.map((option) => <OptionItem key={option.value} option={option} />)}
              </SelectPrimitive.List>
            </SelectPrimitive.Popup>
          </SelectPrimitive.Positioner>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </div>
  );
}

function OptionItem({ option }: { option: AppSelectOption }) {
  return (
    <SelectPrimitive.Item
      value={option.value}
      disabled={option.disabled}
      className={cn(
        'flex w-full cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-xs transition-colors outline-none sm:text-[13px]',
        'border-transparent font-medium text-stone-600',
        'data-highlighted:bg-stone-100 data-highlighted:text-[#181700]',
        'data-[selected]:border-stone-200 data-[selected]:bg-[#F4F4F1] data-[selected]:font-bold data-[selected]:text-[#181700]',
        'data-disabled:cursor-not-allowed data-disabled:opacity-40',
      )}
    >
      <SelectPrimitive.ItemText className="min-w-0 flex-1 truncate">
        {option.label}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator>
        <Check className="h-3.5 w-3.5 shrink-0" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}
