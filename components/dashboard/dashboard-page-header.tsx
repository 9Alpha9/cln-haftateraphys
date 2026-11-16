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
    <header className="w-full border-b border-stone-200/90 pb-3 pt-3 sm:pb-5 sm:pt-4">
      <Breadcrumb items={breadcrumbs} />

      <div className="mt-3 flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {icon ? (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 text-white shadow-sm [&_svg]:h-7 [&_svg]:w-7 [&_svg]:text-white">
              {icon}
            </span>
          ) : null}

          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">
              {title}
            </h1>
            {description ? (
              <p className="mt-1.5 max-w-3xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        {action ? (
          <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
            {action}
          </div>
        ) : null}
      </div>
    </header>
  );
}
