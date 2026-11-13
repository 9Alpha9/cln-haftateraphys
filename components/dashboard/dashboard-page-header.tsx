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
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#181700] text-[var(--hafta-org-100)] [&_svg]:h-5 [&_svg]:w-5 [&_svg]:text-[var(--hafta-org-100)]">
              {icon}
            </span>
          ) : null}

          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-[#181700] sm:text-[28px]">
              {title}
            </h1>
            {description ? (
              <p className="mt-1.5 max-w-3xl text-xs leading-relaxed text-stone-500 sm:text-sm">
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
