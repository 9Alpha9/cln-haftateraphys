'use client';

import { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface PasswordFieldProps {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  className?: string;
  disabled?: boolean;
  error?: string;
}

export function PasswordField({
  id,
  name,
  label,
  placeholder = 'Masukkan kata sandi',
  required = true,
  autoComplete = 'current-password',
  className,
  disabled,
  error,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id} className="text-xs font-semibold text-stone-700">
        {label}
      </Label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            'h-12 w-full rounded-xl border bg-white px-4 pr-11 text-sm text-[#181700] placeholder:text-stone-400 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-red-500 bg-red-50/30 text-red-950 focus:border-red-600 focus:outline-none focus-visible:outline-none focus:ring-4 focus:ring-red-500/20'
              : 'border-stone-300 hover:border-stone-400 focus:border-[#181700] focus:outline-none focus-visible:outline-none focus:ring-4 focus:ring-[#f7f000]/30'
          )}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
          className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
        >
          {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
        </button>
      </div>

      {error && (
        <p id={`${id}-error`} className="flex items-center gap-1.5 pt-0.5 text-xs font-medium text-red-600 animate-in fade-in-50 duration-200">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
