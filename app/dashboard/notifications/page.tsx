import { BellRing, Inbox } from 'lucide-react';
import Link from 'next/link';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { Card, CardContent } from '@/components/ui/card';
import { requirePermission, PERMISSIONS } from '@/lib/permissions';
import { getNotificationsPage } from '@/server/queries/notifications';
import { NotificationList } from '@/components/dashboard/notification-list';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requirePermission(PERMISSIONS.APPOINTMENT_LIST);
  const { page } = await searchParams;
  const result = await getNotificationsPage(Number(page) || 1);

  const hrefFor = (pageNumber: number) =>
    `/dashboard/notifications?${new URLSearchParams({ page: String(pageNumber) }).toString()}`;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Notifikasi"
        description="Seluruh aktivitas dan pemberitahuan untuk akun Anda."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Notifikasi' }]}
        action={
          <Link href="/dashboard/notifications" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
            <BellRing className="h-4 w-4" aria-hidden="true" /> Lihat Semua
          </Link>
        }
      />

      <Card>
        <CardContent className="p-0">
          {result.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Inbox className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">Belum ada notifikasi</p>
            </div>
          ) : (
            <NotificationList items={result.items} />
          )}
        </CardContent>
      </Card>

      {result.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={result.page > 1 ? hrefFor(result.page - 1) : hrefFor(1)}
                aria-disabled={result.page <= 1}
              />
            </PaginationItem>
            {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((pageNumber) => (
              <PaginationItem key={pageNumber}>
                <PaginationLink href={hrefFor(pageNumber)} isActive={pageNumber === result.page}>
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href={result.page < result.totalPages ? hrefFor(result.page + 1) : hrefFor(result.totalPages)}
                aria-disabled={result.page >= result.totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
