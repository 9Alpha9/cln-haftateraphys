import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function SkeletonBlock({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      aria-hidden="true"
      style={style}
      className={cn('animate-pulse rounded-lg bg-stone-200/70', className)}
    />
  );
}

export function SkeletonLine({ className }: { className?: string }) {
  return <SkeletonBlock className={cn('h-3 rounded-md bg-stone-200/60', className)} />;
}

export function SkeletonPanel({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-3xl border border-stone-200 bg-white', className)}
    >
      {children}
    </div>
  );
}

type HeaderSkeletonProps = {
  action?: 'none' | 'single' | 'double';
  className?: string;
};

export function PageHeaderSkeleton({ action = 'none', className }: HeaderSkeletonProps) {
  return (
    <header className={cn('mb-7 w-full border-b border-stone-200/90 pb-6 pt-6', className)}>
      <div className="flex items-center gap-2">
        <SkeletonBlock className="h-3 w-20 rounded-md bg-stone-100" />
        <SkeletonBlock className="h-3 w-2 rounded-md bg-stone-100" />
        <SkeletonBlock className="h-3 w-24 rounded-md bg-stone-100" />
      </div>

      <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <SkeletonBlock className="h-11 w-11 shrink-0 rounded-full bg-stone-200" />
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBlock className="h-7 w-52 max-w-full rounded-lg bg-stone-200" />
            <SkeletonLine className="w-full max-w-xl" />
            <SkeletonLine className="w-3/4 max-w-md bg-stone-100" />
          </div>
        </div>

        {action !== 'none' ? (
          <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
            <SkeletonBlock className="h-10 w-28 rounded-full bg-stone-200" />
            {action === 'double' ? <SkeletonBlock className="h-10 w-36 rounded-full bg-stone-200" /> : null}
          </div>
        ) : null}
      </div>
    </header>
  );
}

export function ToolbarSkeleton({ tabs = 3, search = true }: { tabs?: number; search?: boolean }) {
  return (
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div className="flex items-center gap-1.5 overflow-hidden">
        {Array.from({ length: tabs }, (_, index) => (
          <SkeletonBlock
            key={index}
            className={cn('h-8 rounded-xl', index === 0 ? 'w-24 bg-stone-300/70' : 'w-28 bg-stone-200/70')}
          />
        ))}
      </div>
      {search ? <SkeletonBlock className="h-10 w-full rounded-xl sm:w-72" /> : null}
    </div>
  );
}

export function ListRowsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y divide-stone-100">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-4 py-4">
          <SkeletonBlock className="h-11 w-11 shrink-0 rounded-full bg-stone-100" />
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBlock className="h-4 w-40 max-w-full rounded-md bg-stone-200/80" />
            <SkeletonLine className="w-64 max-w-full bg-stone-100" />
          </div>
          <SkeletonBlock className="hidden h-8 w-24 rounded-full bg-stone-100 sm:block" />
        </div>
      ))}
    </div>
  );
}

export function TableRowsSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden">
      <div className="flex items-center gap-4 border-b border-stone-200 pb-3">
        {Array.from({ length: columns }, (_, index) => (
          <SkeletonBlock key={index} className="h-3 flex-1 rounded-md bg-stone-100" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="flex items-center gap-4 border-b border-stone-100 py-4 last:border-b-0">
          {Array.from({ length: columns }, (_, column) => (
            <SkeletonBlock
              key={column}
              className={cn('h-4 flex-1 rounded-md', column === 0 ? 'bg-stone-200/80' : 'bg-stone-100')}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function FormFieldsSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {Array.from({ length: fields }, (_, index) => (
        <div key={index} className={cn('space-y-2', index === fields - 1 && fields % 2 === 1 && 'sm:col-span-2')}>
          <SkeletonLine className="w-24" />
          <SkeletonBlock className="h-11 w-full rounded-xl bg-stone-100" />
        </div>
      ))}
      <div className="flex justify-end gap-2 pt-2 sm:col-span-2">
        <SkeletonBlock className="h-10 w-24 rounded-full bg-stone-100" />
        <SkeletonBlock className="h-10 w-36 rounded-full bg-stone-200" />
      </div>
    </div>
  );
}
