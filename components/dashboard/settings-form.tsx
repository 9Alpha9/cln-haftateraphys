'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Database, Mail, Settings as SettingsIcon, Shield, HardDrive } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import type { AppSettings } from '@/lib/settings';
import { saveAppSettings } from '@/server/actions/app-settings';

export function SettingsForm({
  initial,
  emailConfigured,
  r2Configured,
}: {
  initial: AppSettings;
  emailConfigured: boolean;
  r2Configured: boolean;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      clinic_name: String(formData.get('clinic_name') ?? ''),
      clinic_phone: String(formData.get('clinic_phone') ?? ''),
      clinic_email: String(formData.get('clinic_email') ?? ''),
      clinic_address: String(formData.get('clinic_address') ?? ''),
      appointment_reminders_enabled: formData.get('appointment_reminders_enabled') === 'on' ? 'true' : 'false',
    };

    startTransition(async () => {
      const result = await saveAppSettings(payload);
      if (result.ok) {
        showToast('success', 'Pengaturan disimpan.');
        router.refresh();
      } else {
        showToast('error', result.error);
      }
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-stone-200 bg-white p-4 sm:p-5 lg:col-span-2">
        <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
          <SettingsIcon className="h-4 w-4 text-[#181700]" />
          <h2 className="text-sm font-bold text-[#181700]">Pengaturan Umum</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="clinic_name">Nama Klinik</Label>
            <Input id="clinic_name" name="clinic_name" defaultValue={initial.clinic_name} disabled={pending} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clinic_phone">Nomor Telepon</Label>
            <Input id="clinic_phone" name="clinic_phone" defaultValue={initial.clinic_phone} disabled={pending} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clinic_email">Email Klinik</Label>
            <Input id="clinic_email" name="clinic_email" type="email" defaultValue={initial.clinic_email} disabled={pending} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clinic_address">Alamat</Label>
            <Input id="clinic_address" name="clinic_address" defaultValue={initial.clinic_address} disabled={pending} />
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 rounded-xl bg-[#FAFAF8] p-3 text-xs text-stone-600">
          <input
            type="checkbox"
            name="appointment_reminders_enabled"
            defaultChecked={initial.appointment_reminders_enabled === 'true'}
            disabled={pending}
            className="mt-0.5 h-4 w-4 rounded border-stone-300"
          />
          <span>
            <span className="font-semibold text-[#181700]">Pengingat appointment otomatis</span>
            <span className="mt-0.5 block">
              Kirim notifikasi in-app sehari sebelum jadwal terapi (dijalankan oleh cron harian).
            </span>
          </span>
        </label>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full bg-[var(--hafta-org-100)] px-5 text-xs font-bold text-[#181700] transition-colors hover:bg-[var(--hafta-org-200)] disabled:opacity-60"
          >
            {pending ? 'Menyimpan…' : 'Simpan Pengaturan'}
          </button>
        </div>
      </form>

      <div className="space-y-3">
        <div className="rounded-3xl border border-stone-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-[#181700]" />
            <p className="text-sm font-bold text-[#181700]">Email Provider</p>
          </div>
          <p className="mt-2 text-xs text-stone-500">
            {emailConfigured ? 'Terkonfigurasi.' : 'Belum dikonfigurasi.'} Dipakai untuk reset password dan verifikasi email.
          </p>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-[#181700]" />
            <p className="text-sm font-bold text-[#181700]">Penyimpanan Dokumen</p>
          </div>
          <p className="mt-2 text-xs text-stone-500">
            {r2Configured ? 'Cloudflare R2 terkonfigurasi.' : 'R2 belum dikonfigurasi.'}
          </p>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-[#181700]" />
            <p className="text-sm font-bold text-[#181700]">Database</p>
          </div>
          <p className="mt-2 text-xs text-stone-500">Neon PostgreSQL terhubung melalui Drizzle ORM.</p>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#181700]" />
            <p className="text-sm font-bold text-[#181700]">Keamanan</p>
          </div>
          <p className="mt-2 text-xs text-stone-500">MFA staf belum diaktifkan. Reset password dan verifikasi email tersedia.</p>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-[#181700]" />
            <p className="text-sm font-bold text-[#181700]">Cron</p>
          </div>
          <p className="mt-2 text-xs text-stone-500">Endpoint pengingat: `/api/cron/appointment-reminders` (butuh `CRON_SECRET`).</p>
        </div>
      </div>
    </div>
  );
}
