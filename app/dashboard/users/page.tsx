import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { UserRoleSelector } from '@/components/dashboard/user-role-selector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { UserPlus, Users, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { requireSession } from '@/lib/auth/require-session';
import { hasPermission, PERMISSIONS, requirePermission, type Role } from '@/lib/permissions';
import { getRoleColor, getRoleLabel } from '@/lib/role-utils';
import { getUsersList } from '@/server/queries/users';
import { DeleteUserButton } from '@/components/dashboard/delete-user-button';

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requirePermission(PERMISSIONS.USER_LIST);
  const { session, role } = await requireSession({ redirectToLogin: true });
  const { page } = await searchParams;
  const result = await getUsersList(Number(page) || 1);
  const users = result.items;
  const canManageRole = role === 'SUPER_ADMIN' && hasPermission(role, PERMISSIONS.ROLE_ASSIGN);
  const canDeleteUser = role === 'SUPER_ADMIN' && hasPermission(role, PERMISSIONS.USER_SUSPEND);

  const hrefFor = (pageNumber: number) =>
    `/dashboard/users?${new URLSearchParams({ page: String(pageNumber) }).toString()}`;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Manajemen Pengguna"
        description="Kelola akun pengguna dan role."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Pengguna' }]}
        action={
          <Button size="lg">
            <UserPlus className="h-4 w-4" aria-hidden="true" /> Tambah Pengguna
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengguna</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">Belum ada pengguna terdaftar</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Pengguna akan muncul di sini setelah registrasi</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Telepon</TableHead>
                    <TableHead className="text-right">Terdaftar</TableHead>
                    {canDeleteUser && <TableHead className="text-right">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const role = (user.accountType ?? 'USER') as Role;
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {user.accountType === 'USER' && (
                              <ShieldAlert className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                            )}
                            <span>{user.displayName ?? user.name ?? 'Tidak diketahui'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          {canManageRole ? (
                            <UserRoleSelector
                              userId={user.id}
                              currentRole={role}
                              disabled={user.id === session.user.id}
                            />
                          ) : (
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getRoleColor(role)}`}
                            >
                              {getRoleLabel(role)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{user.phone ?? '-'}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {user.createdAt.toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </TableCell>
                        {canDeleteUser && (
                          <TableCell className="text-right">
                            <DeleteUserButton
                              userId={user.id}
                              userName={user.displayName ?? user.name ?? 'pengguna'}
                              disabled={user.id === session.user.id}
                            />
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
