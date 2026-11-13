import Link from 'next/link';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { UserRoleSelector } from '@/components/dashboard/user-role-selector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { UserListFilters } from '@/components/dashboard/users/user-list-filters';
import { UserSuspensionButton } from '@/components/dashboard/users/user-suspension-button';
import { UserDetailButton } from '@/components/dashboard/users/user-detail-button';
import { UserPlus, Users, ShieldAlert } from 'lucide-react';
import { requireSession } from '@/lib/auth/require-session';
import { hasPermission, PERMISSIONS, requirePermission, type Role } from '@/lib/permissions';
import { getRoleColor, getRoleLabel } from '@/lib/role-utils';
import { getUsersList } from '@/server/queries/users';
import { getTherapistScheduleOverview } from '@/server/queries/therapist-schedules';
import { DeleteUserButton } from '@/components/dashboard/delete-user-button';
import { TherapistSchedulePanel } from '@/components/dashboard/therapist-schedule-panel';
import { cn } from '@/lib/utils';

type RoleFilter = '' | 'SUPER_ADMIN' | 'ADMIN' | 'THERAPIST' | 'STAFF' | 'USER';
type StatusFilter = '' | 'active' | 'suspended';

const ROLE_FILTERS: RoleFilter[] = ['', 'SUPER_ADMIN', 'ADMIN', 'THERAPIST', 'STAFF', 'USER'];

function buildHrefTemplate(search: string, role: RoleFilter, status: StatusFilter, perPage: number) {
  const params = new URLSearchParams();
  if (search) params.set('q', search);
  if (role) params.set('role', role);
  if (status) params.set('status', status);
  params.set('perPage', String(perPage));
  return `/dashboard/users?${params.toString()}&page={page}`;
}

function UserStatusBadge({ suspended }: { suspended: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
        suspended
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-[var(--hafta-grn-200)] bg-[var(--hafta-grn-50)] text-[var(--hafta-grn-700)]',
      )}
    >
      <span
        className={cn('h-1.5 w-1.5 rounded-full', suspended ? 'bg-red-500' : 'bg-[var(--hafta-grn-600)]')}
      />
      {suspended ? 'Ditangguhkan' : 'Aktif'}
    </span>
  );
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; perPage?: string; role?: string; status?: string }>;
}) {
  await requirePermission(PERMISSIONS.USER_LIST);
  const { session, role } = await requireSession({ redirectToLogin: true });
  const params = await searchParams;
  const search = params.q?.trim() ?? '';
  const roleFilter = ROLE_FILTERS.includes((params.role ?? '') as RoleFilter)
    ? ((params.role ?? '') as RoleFilter)
    : '';
  const statusFilter: StatusFilter =
    params.status === 'active' || params.status === 'suspended' ? params.status : '';
  const perPageParam = Number(params.perPage);
  const perPage = [10, 25, 50].includes(perPageParam) ? perPageParam : 10;
  const result = await getUsersList(
    Number(params.page) || 1,
    perPage,
    search,
    roleFilter,
    statusFilter,
  );
  const users = result.items;
  const canManageRole = role === 'SUPER_ADMIN' && hasPermission(role, PERMISSIONS.ROLE_ASSIGN);
  const canManageAccountStatus =
    hasPermission(role, PERMISSIONS.USER_SUSPEND) || hasPermission(role, PERMISSIONS.USER_REACTIVATE);
  const canDeleteUser = role === 'SUPER_ADMIN' && hasPermission(role, PERMISSIONS.USER_SUSPEND);
  const canViewUserDetail = hasPermission(role, PERMISSIONS.USER_READ);
  const canCreateUser = hasPermission(role, PERMISSIONS.USER_CREATE);
  const canManageSchedules =
    role !== 'USER' &&
    (hasPermission(role, PERMISSIONS.APPOINTMENT_UPDATE) ||
      hasPermission(role, PERMISSIONS.SETTINGS_MANAGE));
  const scheduleOverview = canManageSchedules ? await getTherapistScheduleOverview() : [];
  const schedulesByTherapist = new Map(
    scheduleOverview.map((therapist) => [therapist.therapistId, therapist])
  );
  const hasActions = canViewUserDetail || canManageAccountStatus || canDeleteUser;
  const hasActiveFilter = Boolean(search || roleFilter || statusFilter);

  return (
    <div className="space-y-4 sm:space-y-5">
      <DashboardPageHeader
        title="Manajemen Pengguna"
        description="Kelola akun pengguna, status akun, dan role."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Pengguna' }]}
        icon={<Users className="h-7 w-7 text-white" />}
        action={
          canCreateUser ? (
            <Link
              href="/dashboard/users/add"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--hafta-org-100)] px-4 text-xs font-bold text-[#181700]  transition-colors hover:bg-[var(--hafta-org-200)] sm:w-auto sm:px-5 sm:text-[13px]"
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" /> Tambah Pengguna
            </Link>
          ) : undefined
        }
      />

      <Card className="overflow-visible">
        <CardHeader className="gap-3">
          <CardTitle>Daftar Pengguna</CardTitle>
          <UserListFilters
            initialSearch={search}
            initialRole={roleFilter}
            initialStatus={statusFilter}
            perPage={perPage}
          />
          <p className="text-xs text-stone-500">
            Menampilkan <span className="font-bold text-[#181700]">{users.length}</span> dari{' '}
            <span className="font-bold text-[#181700]">{result.total}</span> pengguna
          </p>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center p-3.5 text-center sm:p-5">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--hafta-org-50)] text-[#181700]">
                <Users className="h-6 w-6" />
              </span>
              <p className="mt-3 text-sm font-bold text-[#181700]">
                {hasActiveFilter ? 'Pengguna tidak ditemukan' : 'Belum ada pengguna terdaftar'}
              </p>
              <p className="mt-1 max-w-sm text-xs text-stone-500">
                {hasActiveFilter
                  ? 'Ubah kata kunci atau filter untuk menemukan akun lain.'
                  : 'Pengguna akan muncul di sini setelah registrasi.'}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile: compact list without horizontal table scroll */}
              <ul className="divide-y divide-stone-100 md:hidden">
                {users.map((user, index) => {
                  const accountRole = (user.accountType ?? 'USER') as Role;
                  const rowNumber = (result.currentPage - 1) * perPage + index + 1;
                  const suspended = Boolean(user.suspendedAt);
                  const schedule = schedulesByTherapist.get(user.id);
                  return (
                    <li key={user.id} className="py-3.5 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#181700]">
                            <span className="mr-1.5 font-mono text-[11px] font-semibold text-stone-400">
                              {rowNumber}.
                            </span>
                            {user.displayName ?? user.name ?? 'Tidak diketahui'}
                          </p>
                          <p className="truncate text-xs text-stone-500">{user.email}</p>
                        </div>
                        <UserStatusBadge suspended={suspended} />
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                            getRoleColor(accountRole),
                          )}
                        >
                          {getRoleLabel(accountRole)}
                        </span>
                        <span>{user.phone ?? 'Nomor belum diisi'}</span>
                        <span aria-hidden="true">•</span>
                        <span>
                          Terdaftar{' '}
                          {user.createdAt.toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      {canManageRole ? (
                        <div className="mt-2.5">
                          <UserRoleSelector
                            userId={user.id}
                            currentRole={accountRole}
                            disabled={user.id === session.user.id}
                          />
                        </div>
                      ) : null}

                      {canManageSchedules && schedule ? (
                        <div className="mt-2.5">
                          <TherapistSchedulePanel therapists={[schedule]} label="Atur Jadwal" />
                        </div>
                      ) : null}

                      {hasActions ? (
                        <div className="mt-2.5 flex flex-wrap items-center gap-2">
                          {canViewUserDetail && (
                            <UserDetailButton
                              user={{
                                name: user.displayName ?? user.name ?? 'Tidak diketahui',
                                email: user.email,
                                role: accountRole,
                                phone: user.phone,
                                suspended,
                                createdAt: user.createdAt,
                              }}
                            />
                          )}
                          {canManageAccountStatus && (
                            <UserSuspensionButton
                              userId={user.id}
                              userName={user.displayName ?? user.name ?? user.email}
                              suspended={suspended}
                              disabled={user.id === session.user.id}
                            />
                          )}
                          {canDeleteUser && (
                            <DeleteUserButton
                              userId={user.id}
                              userName={user.displayName ?? user.name ?? 'pengguna'}
                              disabled={user.id === session.user.id}
                            />
                          )}
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>

              {/* Desktop/tablet: full table */}
              <div className="hidden overflow-x-auto md:block">
                <Table className="min-w-[1080px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="sticky left-0 z-30 bg-[#FBFBFA]"
                        style={{ width: 56, minWidth: 56 }}
                      >
                        No.
                      </TableHead>
                      <TableHead
                        className="sticky left-[56px] z-30 bg-[#FBFBFA]"
                        style={{ width: 180, minWidth: 180 }}
                      >
                        Nama
                      </TableHead>
                      <TableHead
                        className="sticky left-[236px] z-30 border-r border-stone-200/80 bg-[#FBFBFA] -[6px_0_8px_-8px_rgba(24,23,0,0.25)]"
                        style={{ width: 240, minWidth: 240 }}
                      >
                        Email
                      </TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Telepon</TableHead>
                      <TableHead className="text-right">Terdaftar</TableHead>
                      {canManageSchedules && <TableHead className="text-right">Jadwal</TableHead>}
                      {hasActions && <TableHead className="text-right">Aksi</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user, index) => {
                      const accountRole = (user.accountType ?? 'USER') as Role;
                      const suspended = Boolean(user.suspendedAt);
                      const rowNumber = (result.currentPage - 1) * perPage + index + 1;
                      return (
                        <TableRow key={user.id}>
                          <TableCell
                            className="sticky left-0 z-20 bg-white font-mono text-xs text-stone-500"
                            style={{ width: 56, minWidth: 56 }}
                          >
                            {rowNumber}
                          </TableCell>
                          <TableCell
                            className="sticky left-[56px] z-20 bg-white font-medium"
                            style={{ width: 180, minWidth: 180 }}
                          >
                            <div className="flex items-center gap-2">
                              {user.accountType === 'USER' && (
                                <ShieldAlert className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                              )}
                              <span>{user.displayName ?? user.name ?? 'Tidak diketahui'}</span>
                            </div>
                          </TableCell>
                          <TableCell
                            className="sticky left-[236px] z-20 border-r border-stone-200/80 bg-white text-muted-foreground -[6px_0_8px_-8px_rgba(24,23,0,0.25)]"
                            style={{ width: 240, minWidth: 240 }}
                          >
                            {user.email}
                          </TableCell>
                          <TableCell>
                            {canManageRole ? (
                              <UserRoleSelector
                                userId={user.id}
                                currentRole={accountRole}
                                disabled={user.id === session.user.id}
                              />
                            ) : (
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getRoleColor(accountRole)}`}
                              >
                                {getRoleLabel(accountRole)}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <UserStatusBadge suspended={suspended} />
                          </TableCell>
                          <TableCell className="text-muted-foreground">{user.phone ?? '-'}</TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {user.createdAt.toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </TableCell>
                          {canManageSchedules && (
                            <TableCell className="text-right">
                              {(() => {
                                const schedule = schedulesByTherapist.get(user.id);
                                return schedule ? (
                                  <TherapistSchedulePanel therapists={[schedule]} label="Atur Jadwal" />
                                ) : (
                                  <span className="text-xs text-muted-foreground">-</span>
                                );
                              })()}
                            </TableCell>
                          )}
                          {hasActions && (
                            <TableCell>
                              <div className="flex items-center justify-end gap-2">
                                {canViewUserDetail && (
                                  <UserDetailButton
                                    user={{
                                      name: user.displayName ?? user.name ?? 'Tidak diketahui',
                                      email: user.email,
                                      role: accountRole,
                                      phone: user.phone,
                                      suspended,
                                      createdAt: user.createdAt,
                                    }}
                                  />
                                )}
                                {canManageAccountStatus && (
                                  <UserSuspensionButton
                                    userId={user.id}
                                    userName={user.displayName ?? user.name ?? user.email}
                                    suspended={suspended}
                                    disabled={user.id === session.user.id}
                                  />
                                )}
                                {canDeleteUser && (
                                  <DeleteUserButton
                                    userId={user.id}
                                    userName={user.displayName ?? user.name ?? 'pengguna'}
                                    disabled={user.id === session.user.id}
                                  />
                                )}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {users.length > 0 ? (
        <PaginationBar
          page={result.currentPage}
          pageCount={result.totalPages}
          hrefTemplate={buildHrefTemplate(search, roleFilter, statusFilter, perPage)}
          pageSize={perPage}
          pageSizeOptions={[10, 25, 50]}
          pageSizeHrefTemplate={buildHrefTemplate(search, roleFilter, statusFilter, 0)
            .replace('perPage=0', 'perPage={size}')
            .replace('page={page}', 'page=1')}
        />
      ) : null}
    </div>
  );
}
