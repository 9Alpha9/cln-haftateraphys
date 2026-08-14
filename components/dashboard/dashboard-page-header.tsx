import { Breadcrumb, type BreadcrumbItem } from '@/components/ui/breadcrumb';

export function DashboardPageHeader({
  title,
  description,
  breadcrumbs,
  action,
}: {
  title: string;
  description?: string;
  breadcrumbs: BreadcrumbItem[];
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <Breadcrumb items={breadcrumbs} />
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground md:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
