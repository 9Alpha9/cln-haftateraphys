import { Bell, Inbox } from 'lucide-react';
import Link from 'next/link';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { requirePermission, PERMISSIONS } from '@/lib/permissions';
import { getNotificationsPage } from '@/server/queries/notifications';
import { NotificationList } from '@/components/dashboard/notification-list';
import { PaginationBar } from '@/components/ui/pagination-bar';

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; perPage?: string }>;
}) {
  await requirePermission(PERMISSIONS.APPOINTMENT_LIST);
  const { page, perPage: perPageParam } = await searchParams;
  const perPageNumber = Number(perPageParam);
  const perPage = [10, 20, 50].includes(perPageNumber) ? perPageNumber : 10;
  const result = await getNotificationsPage(Number(page) || 1, perPage);

  return (
    <div className="space-y-4 sm:space-y-5">
      <DashboardPageHeader
        title="Pusat Notifikasi"
        description="Riwayat aktivitas dan pemberitahuan penting untuk akun Anda."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Notifikasi' }]}
        icon={<Bell className="h-7 w-7 text-hafta-ylw-900" strokeWidth={2.25} />}
      />

      {result.items.length === 0 ? (
        <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-stone-200 bg-white p-3.5 text-center sm:p-5">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--hafta-ylw-50)] text-[#181700]">
            <Inbox className="h-6 w-6" />
          </span>
          <p className="mt-3 text-sm font-bold text-[#181700]">Belum Ada Notifikasi</p>
          <p className="mt-1 max-w-sm text-xs text-stone-500">
            Semua pembaruan jadwal, rekam medis, dan aktivitas akun akan muncul di sini.
          </p>
        </div>
      ) : (
        <section className="overflow-hidden rounded-3xl border border-stone-200/70 bg-white shadow-[0_8px_30px_rgba(24,23,0,0.05)]">
          <NotificationList items={result.items} />
        </section>
      )}

      <PaginationBar
        page={result.page}
        pageCount={result.totalPages}
        hrefTemplate={`/dashboard/notifications?page={page}&perPage=${perPage}`}
        pageSize={perPage}
        pageSizeOptions={[10, 20, 50]}
        pageSizeHrefTemplate="/dashboard/notifications?page=1&perPage={size}"
      />
    </div>
  );
}
