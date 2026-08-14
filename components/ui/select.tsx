'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type SelectProps = React.ComponentProps<'select'> & {
  /** Applied to the wrapper element. Use this to control the width. */
  className?: string;
  /** Applied to the native <select> element (e.g. to tweak height). */
  selectClassName?: string;
};

/**
 * Native select wrapped with a consistent dropdown arrow. Width is controlled
 * on the wrapper (`className`) so the chevron always aligns with the select's
 * right edge, regardless of the select's own width.
 */
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, selectClassName, children, ...props }, ref) => (
    <div className={cn('relative w-full', className)}>
      <select
        ref={ref}
        className={cn(
          'flex h-10 w-full cursor-pointer appearance-none overflow-hidden text-ellipsis whitespace-nowrap rounded-lg border border-input bg-background py-2 pl-3 pr-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60',
          selectClassName,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  ),
);
Select.displayName = 'Select';

export { Select };
