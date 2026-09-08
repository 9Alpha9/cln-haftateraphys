import { type ReactNode } from 'react';
import { Breadcrumb, type BreadcrumbItem } from '@/components/ui/breadcrumb';

export function DashboardPageHeader({
  title,
  description,
  breadcrumbs,
  action,
  icon,
}: {
  title: string;
  description?: string;
  breadcrumbs: BreadcrumbItem[];
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="relative -ml-[calc(50vw-50%)] -mr-[calc(50vw-50%)] -mt-8 w-[100vw] overflow-hidden bg-gradient-to-r from-amber-50/15 via-orange-50/30 to-amber-100/60 px-4 pt-6 pb-6 sm:-mt-8 sm:px-6 lg:px-8 border-b border-gray-500/10">
      {/* Decorative shapes */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-gradient-to-br from-amber-300/40 to-orange-300/30 blur-md" />
      <div className="pointer-events-none absolute -right-4 -top-4 h-28 w-28 rounded-full bg-gradient-to-br from-amber-400/30 to-orange-400/20 blur-sm" />
      <div className="pointer-events-none absolute right-24 -top-10 h-20 w-20 rounded-full bg-gradient-to-br from-amber-200/50 to-orange-200/40 blur-xs" />

      <div className="relative mx-auto max-w-7xl">
        <Breadcrumb items={breadcrumbs} />
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4 min-w-0">
            {icon ? (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 shadow-lg shadow-amber-200/50">
                {icon}
              </div>
            ) : null}
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                {title}
              </h1>
              {description ? (
                <p className="mt-1 max-w-2xl text-sm text-gray-500 sm:text-base">{description}</p>
              ) : null}
            </div>
          </div>
          {action ? <div className="shrink-0 w-full sm:w-auto">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}
