'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Current value between 0 and `max`. Pass null/undefined for an indeterminate bar. */
  value?: number | null;
  max?: number;
  indicatorClassName?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, max = 100, indicatorClassName, ...props }, ref) => {
    const clamped = value == null ? null : Math.min(max, Math.max(0, value));
    const percent = clamped == null ? null : (clamped / max) * 100;

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={clamped ?? undefined}
        className={cn(
          'relative h-2 w-full overflow-hidden rounded-full bg-[var(--hafta-100)]',
          className,
        )}
        {...props}
      >
        <div
          className={cn(
            'h-full rounded-full bg-[var(--hafta-900)] transition-[width] duration-300 ease-out',
            percent == null && 'w-1/3 animate-pulse',
            indicatorClassName,
          )}
          style={percent == null ? undefined : { width: `${percent}%` }}
        />
      </div>
    );
  },
);
Progress.displayName = 'Progress';

export { Progress };
