'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type NumberInputProps = Omit<React.ComponentProps<'input'>, 'type' | 'inputMode' | 'pattern'> & {
  min?: number;
  max?: number;
};

export function NumberInput({
  className,
  min = 0,
  max = 10,
  defaultValue,
  onChange,
  onBlur,
  ...props
}: NumberInputProps) {
  const [value, setValue] = React.useState(String(defaultValue ?? ''));

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value.replace(/[^0-9]/g, '');
    const numberValue = nextValue === '' ? null : Number(nextValue);
    if (numberValue !== null && (numberValue < min || numberValue > max)) return;
    setValue(nextValue);
    event.target.value = nextValue;
    onChange?.(event);
  }

  function handleBlur(event: React.FocusEvent<HTMLInputElement>) {
    if (value !== '') {
      const clamped = String(Math.min(max, Math.max(min, Number(value))));
      setValue(clamped);
      event.target.value = clamped;
    }
    onBlur?.(event);
  }

  return (
    <input
      {...props}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      className={cn(
        'h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50',
        className,
      )}
    />
  );
}
