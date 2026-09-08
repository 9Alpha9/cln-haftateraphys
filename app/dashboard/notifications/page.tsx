import { Bell, Inbox } from 'lucide-react';
import Link from 'next/link';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { requirePermission, PERMISSIONS } from '@/lib/permissions';
import { getNotificationsPage } from '@/server/queries/notifications';
import { NotificationList } from '@/components/dashboard/notification-list';
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
        title="Pusat Notifikasi"
        description="Riwayat aktivitas dan pemberitahuan penting untuk akun Anda."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Notifikasi' }]}
        icon={<Bell className="h-7 w-7 text-hafta-ylw-900" strokeWidth={2.25} />}
      />

      <section className="overflow-hidden border-y border-[#E5E7EB] bg-white">
        {result.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#F1F5F9] text-[#64748B]">
              <Inbox className="h-7 w-7" strokeWidth={2} />
            </div>
            <p className="text-[15px] font-bold text-[#111827]">Belum Ada Notifikasi</p>
            <p className="mt-1 max-w-sm text-[13px] text-[#6B7280]">
              Semua pembaruan jadwal, rekam medis, dan aktivitas akun akan muncul di sini.
            </p>
          </div>
        ) : (
          <NotificationList items={result.items} />
        )}
      </section>

      {result.totalPages > 1 && (
        <div className="flex justify-center pt-2">
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
        </div>
      )}
    </div>
  );
}
