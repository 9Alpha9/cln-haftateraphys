import Link from 'next/link';
import type { Metadata } from 'next';
import { Mail, Phone, RefreshCcw, Wrench } from 'lucide-react';
import { getMaintenanceFlags, decideMaintenance } from '@/lib/maintenance';
import { getAppSettingsUnsafe } from '@/server/queries/app-settings';
import { MaintenanceCountdown } from '@/components/maintenance-countdown';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pemeliharaan Sistem',
  robots: { index: false, follow: false },
};

export default async function MaintenancePage() {
  const [flags, settings] = await Promise.all([getMaintenanceFlags(), getAppSettingsUnsafe()]);
  const active = decideMaintenance({ flags }).mode === 'maintenance';
  const whatsappNumber = settings.clinic_phone.replace(/[^0-9]/g, '').replace(/^0/, '62');

  return (
    <div className="flex min-h-screen flex-col bg-[#FCFCFB]">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-14 text-center sm:px-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-[#181700] shadow-[0_18px_50px_-24px_rgba(24,23,0,0.35)] ring-1 ring-stone-200">
          <Wrench className="h-9 w-9" aria-hidden="true" />
        </div>

        <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--hafta-700)]">
          Hafta Fisioterapi
        </p>
        <h1 className="mt-2 max-w-xl text-2xl font-bold tracking-tight text-[#181700] sm:text-3xl">
          {flags.title}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-stone-600">{flags.message}</p>

        <MaintenanceCountdown until={flags.until} />

        <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#181700] px-5 text-xs font-bold text-white transition-colors hover:bg-[#2c2a10] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            Hubungi via WhatsApp
          </a>
          <Link
            href="/maintenance"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-5 text-xs font-bold text-[#181700] transition-colors hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
          >
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            Muat ulang halaman
          </Link>
        </div>

        {settings.clinic_email ? (
          <p className="mt-5 inline-flex items-center gap-2 text-xs text-stone-500">
            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
            {settings.clinic_email}
          </p>
        ) : null}

        <p className="mt-10 max-w-lg text-[11px] leading-relaxed text-stone-400">
          Informasi pasien tetap tersimpan aman. Akses rekam medis dan jadwal akan tersedia kembali
          setelah pemeliharaan selesai.
        </p>

        {!active ? (
          <p className="mt-4 rounded-xl bg-white px-4 py-2 text-[11px] text-stone-500 ring-1 ring-stone-200">
            Tidak ada pemeliharaan aktif saat ini. Halaman ini hanya ditampilkan ketika mode
            pemeliharaan diaktifkan oleh Super Admin.
          </p>
        ) : null}
      </main>

      <footer className="border-t border-stone-200/80 py-5 text-center text-[11px] text-stone-400">
        © {new Date().getFullYear()} Hafta Fisioterapi. Semua hak dilindungi.
      </footer>
    </div>
  );
}
