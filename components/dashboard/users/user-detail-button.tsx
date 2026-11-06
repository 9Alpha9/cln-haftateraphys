'use client';

import { useState } from 'react';
import { Eye, Mail, Phone, ShieldCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { getRoleColor, getRoleLabel } from '@/lib/role-utils';
import type { Role } from '@/lib/permissions/roles';
import { cn } from '@/lib/utils';

export type UserDetailData = {
  name: string;
  email: string;
  role: Role;
  phone: string | null;
  suspended: boolean;
  createdAt: Date;
};

export function UserDetailButton({ user }: { user: UserDetailData }) {
  const [open, setOpen] = useState(false);
  const created = new Date(user.createdAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-stone-200/90 bg-white px-3 text-xs font-semibold text-[#181700] transition-colors hover:bg-stone-100"
      >
        <Eye className="h-3.5 w-3.5" />
        Detail
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-3xl border-stone-200/70 p-0">
          <DialogHeader className="border-b border-stone-100 p-5 text-left">
            <DialogTitle className="text-base font-bold text-[#181700]">Detail Pengguna</DialogTitle>
            <DialogDescription className="text-xs text-stone-500">
              Informasi akun dan status akses.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 p-5">
            <div>
              <p className="text-lg font-bold text-[#181700]">{user.name}</p>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-stone-500">
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate">{user.email}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                  getRoleColor(user.role),
                )}
              >
                {getRoleLabel(user.role)}
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                  user.suspended
                    ? 'border-red-200 bg-red-50 text-red-700'
                    : 'border-[var(--hafta-grn-200)] bg-[var(--hafta-grn-50)] text-[var(--hafta-grn-700)]',
                )}
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    user.suspended ? 'bg-red-500' : 'bg-[var(--hafta-grn-600)]',
                  )}
                />
                {user.suspended ? 'Ditangguhkan' : 'Aktif'}
              </span>
            </div>

            <dl className="space-y-2.5 rounded-2xl bg-[#FBFBFA] p-3.5 text-xs">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-stone-500">Telepon</dt>
                <dd className="inline-flex items-center gap-1.5 font-semibold text-[#181700]">
                  <Phone className="h-3.5 w-3.5 text-stone-400" />
                  {user.phone || '-'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-stone-500">Terdaftar</dt>
                <dd className="font-semibold text-[#181700]">{created}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-stone-500">Akses</dt>
                <dd className="inline-flex items-center gap-1.5 font-semibold text-[#181700]">
                  <ShieldCheck className="h-3.5 w-3.5 text-stone-400" />
                  {getRoleLabel(user.role)}
                </dd>
              </div>
            </dl>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
