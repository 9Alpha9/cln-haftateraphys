'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Eye,
  Loader2,
  Power,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { saveMaintenanceSettings } from '@/server/actions/maintenance';
import type { MaintenanceFlags } from '@/lib/maintenance';

function toLocalInput(value: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

export function MaintenanceConsole({
  initial,
}: {
  initial: MaintenanceFlags;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(initial.enabled);
  const [title, setTitle] = useState(initial.title);
  const [message, setMessage] = useState(initial.message);
  const [until, setUntil] = useState(toLocalInput(initial.until));
  const [confirmOpen, setConfirmOpen] = useState(false);

  const willEnable = enabled;

  function submit() {
    startTransition(async () => {
      const result = await saveMaintenanceSettings({
        enabled: enabled ? 'true' : 'false',
        title,
        message,
        until,
      });
      if (!result.ok) {
        showToast('error', result.error);
        return;
      }
      showToast(
        'success',
        enabled
          ? 'Mode pemeliharaan diaktifkan. Pengguna lain akan diarahkan ke halaman maintenance.'
          : 'Mode pemeliharaan dimatikan. Situs kembali dapat diakses publik.',
      );
      setConfirmOpen(false);
      router.refresh();
    });
  }

  function requestSave() {
    if (enabled !== initial.enabled) {
      setConfirmOpen(true);
      return;
    }
    submit();
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <DashboardPageHeader
        title="Pemeliharaan Situs"
        description="Tutup akses situs untuk pasien dan pengguna lain saat pemeliharaan. Hanya Super Admin yang tetap dapat mengakses dashboard."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Pemeliharaan' },
        ]}
        icon={<Wrench className="h-6 w-6" />}
        action={
          <a
            href="/maintenance"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-stone-200 bg-white px-4 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-50"
          >
            <Eye className="h-4 w-4" />
            Pratinjau halaman
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        }
      />

      <div
        className={`flex items-start gap-3 rounded-2xl border p-4 ${
          enabled
            ? 'border-amber-200 bg-amber-50 text-amber-900'
            : 'border-emerald-200 bg-emerald-50 text-emerald-900'
        }`}
        role="status"
      >
        {enabled ? (
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        ) : (
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        )}
        <div>
          <p className="text-sm font-bold">
            {enabled ? 'Mode pemeliharaan aktif' : 'Situs beroperasi normal'}
          </p>
          <p className="mt-1 text-xs leading-relaxed">
            {enabled
              ? 'Pasien, terapis, admin, dan staf akan melihat halaman pemeliharaan. Data dan sesi login tidak dihapus.'
              : 'Semua pengguna dapat mengakses situs sesuai izin mereka. Aktifkan hanya saat benar-benar diperlukan.'}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            requestSave();
          }}
          className="space-y-5 rounded-3xl border border-stone-200/80 bg-white p-4 sm:p-5"
        >
          <div className="flex items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <h2 className="text-sm font-bold text-[#181700]">Kontrol akses</h2>
              <p className="mt-0.5 text-[11px] text-stone-500">
                Berlaku untuk seluruh halaman publik dan dashboard.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              onClick={() => setEnabled((value) => !value)}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35 ${
                enabled ? 'bg-amber-500' : 'bg-stone-300'
              }`}
              aria-label="Aktifkan mode pemeliharaan"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="space-y-2">
            <label htmlFor="maintenance-title" className="text-xs font-semibold text-stone-700">
              Judul halaman
            </label>
            <input
              id="maintenance-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              required
              disabled={pending}
              className="h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-[#181700] focus:border-[#181700] focus:outline-none focus:ring-4 focus:ring-[var(--hafta-300)]/35 disabled:opacity-60"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="maintenance-message" className="text-xs font-semibold text-stone-700">
              Pesan untuk pengguna
            </label>
            <textarea
              id="maintenance-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={600}
              rows={5}
              required
              disabled={pending}
              className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm leading-relaxed text-[#181700] focus:border-[#181700] focus:outline-none focus:ring-4 focus:ring-[var(--hafta-300)]/35 disabled:opacity-60"
            />
            <p className="text-[11px] text-stone-500">{message.length}/600 karakter. Jangan memuat data pasien.</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="maintenance-until" className="text-xs font-semibold text-stone-700">
              Perkiraan selesai (opsional)
            </label>
            <input
              id="maintenance-until"
              type="datetime-local"
              value={until}
              onChange={(event) => setUntil(event.target.value)}
              disabled={pending}
              className="h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-[#181700] focus:border-[#181700] focus:outline-none focus:ring-4 focus:ring-[var(--hafta-300)]/35 disabled:opacity-60"
            />
            <p className="text-[11px] text-stone-500">
              Setelah waktu ini, situs otomatis terbuka kembali tanpa perlu mematikan manual. Hitung
              mundur juga tampil di halaman pemeliharaan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#181700] px-5 text-xs font-bold text-white transition-colors hover:bg-[#2c2a10] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
              {pending ? 'Menyimpan…' : 'Simpan pengaturan'}
            </button>
            <p className="inline-flex items-center gap-1.5 text-[11px] text-stone-500">
              <Clock3 className="h-3.5 w-3.5" />
              Perubahan berlaku maksimal 5 detik setelah disimpan.
            </p>
          </div>
        </form>

        <aside className="space-y-3">
          <div className="rounded-3xl border border-stone-200/80 bg-white p-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-stone-500">Yang tetap bisa diakses</h3>
            <ul className="mt-2 space-y-2 text-xs text-stone-600">
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" /> Halaman pemeliharaan</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" /> Login Super Admin</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" /> Dashboard Super Admin</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" /> API autentikasi & aset statis</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-stone-200/80 bg-white p-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-stone-500">Yang diblokir</h3>
            <ul className="mt-2 space-y-2 text-xs text-stone-600">
              <li>Landing page & halaman publik</li>
              <li>Dashboard pasien, terapis, admin, dan staf</li>
              <li>Pendaftaran akun baru</li>
              <li>API dashboard & unduhan dokumen</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-[11px] leading-relaxed text-amber-900">
            <p className="font-bold">Catatan operasional</p>
            <p className="mt-1">
              Sesi pengguna yang sedang aktif tidak dicabut. Setelah maintenance berakhir mereka dapat
              melanjutkan tanpa login ulang. Gunakan logout paksa hanya bila ada insiden keamanan.
            </p>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        title={willEnable ? 'Aktifkan mode pemeliharaan?' : 'Matikan mode pemeliharaan?'}
        description={
          willEnable
            ? 'Seluruh pengguna selain Super Admin akan langsung melihat halaman pemeliharaan. Pastikan Anda sudah menyimpan pekerjaan penting.'
            : 'Situs akan segera dapat diakses kembali oleh semua pengguna sesuai izin mereka.'
        }
        confirmLabel={willEnable ? 'Ya, aktifkan' : 'Ya, matikan'}
        cancelLabel="Batal"
        variant={willEnable ? 'destructive' : 'default'}
        pending={pending}
        onConfirm={submit}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
