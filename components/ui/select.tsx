'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type SelectProps = React.ComponentProps<'select'> & {
  className?: string;
  selectClassName?: string;
};

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, selectClassName, children, ...props }, ref) => (
    <div className={cn('relative w-full', className)}>
      <select
        ref={ref}
        className={cn(
          'flex h-10 w-full cursor-pointer appearance-none rounded-lg border border-stone-200/90 bg-white pl-3 pr-10 text-sm text-[#181700] focus:outline-none focus:border-[#181700] focus:ring-4 focus:ring-[#f7f000]/30 disabled:cursor-not-allowed disabled:opacity-60',
          selectClassName,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500"
      />
    </div>
  ),
);
Select.displayName = 'Select';

export { Select };
