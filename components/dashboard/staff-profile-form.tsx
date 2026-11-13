'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Loader2, Lock, Save, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChangePasswordForm } from '@/components/dashboard/change-password-form';
import { SessionManager } from '@/components/dashboard/session-manager';
import { ImageCropModal } from '@/components/ui/image-crop-modal';
import { updateCurrentStaffProfile } from '@/server/actions/staff-profile';
import type { StaffProfileView } from '@/server/queries/staff-profile';

const ROLE_LABELS: Record<string, string> = {
  THERAPIST: 'Terapis',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super Admin',
};

export function StaffProfileForm({ initial }: { initial: StaffProfileView }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(initial.name);
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [phone, setPhone] = useState(initial.phone);
  const [avatar, setAvatar] = useState<string | null>(initial.avatarKey);
  const [error, setError] = useState<string | null>(null);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const initials = (name || initial.email)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  function onAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Ukuran foto maksimal 2MB.');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Format foto harus JPG, PNG, atau WebP.');
      return;
    }
    event.target.value = '';
    const reader = new FileReader();
    reader.onload = () => {
      setCropSource(String(reader.result ?? ''));
      setError(null);
    };
    reader.readAsDataURL(file);
  }

  function save() {
    setError(null);
    if (name.trim().length < 2) {
      setError('Nama lengkap wajib diisi minimal 2 karakter.');
      return;
    }
    startTransition(async () => {
      try {
        await updateCurrentStaffProfile({
          name,
          displayName,
          phone,
          avatarKey: avatar ?? '',
        });
        toast.success('Profil berhasil diperbarui.');
        router.refresh();
      } catch {
        setError('Profil tidak dapat disimpan. Periksa kembali data Anda.');
      }
    });
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="rounded-3xl border border-stone-200/70 bg-white p-4 shadow-[0_8px_30px_rgba(24,23,0,0.05)] sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative mx-auto shrink-0 sm:mx-0">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white ring-1 ring-stone-200">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt="Foto profil" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-[var(--hafta-org-50)] text-2xl font-bold text-[#181700]">
                  {initials || <UserRound className="h-8 w-8" />}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-stone-200 bg-white text-[#181700] transition-colors hover:bg-stone-100"
              aria-label="Ubah foto profil"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h2 className="text-sm font-bold text-[#181700]">Foto Profil</h2>
              <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 text-[10px] font-bold text-stone-600">
                {ROLE_LABELS[initial.role] ?? initial.role}
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-stone-500">
              JPG, PNG, atau WebP maksimal 2MB. Klik ikon kamera pada foto untuk mengganti.
              Foto ini tampil pada header dan daftar terapis.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={onAvatarChange}
            />
            {avatar ? (
              <div className="mt-3 flex justify-center sm:justify-start">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAvatar(null);
                    if (fileRef.current) fileRef.current.value = '';
                  }}
                  className="h-9 rounded-full px-3 text-xs"
                >
                  Hapus Foto
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-stone-200/70 bg-white p-4 shadow-[0_8px_30px_rgba(24,23,0,0.05)] sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <UserRound className="h-4 w-4 text-stone-500" />
          <h2 className="text-sm font-bold text-[#181700]">Identitas Terapis</h2>
        </div>

        {error ? (
          <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {error}
          </p>
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="staff-name" className="text-xs font-semibold text-stone-600">
              Nama Lengkap
            </Label>
            <Input
              id="staff-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={pending}
              className="h-10 rounded-xl border-stone-200 bg-white text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="staff-display-name" className="text-xs font-semibold text-stone-600">
              Nama Tampilan
            </Label>
            <Input
              id="staff-display-name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Nama yang tampil di daftar terapis"
              disabled={pending}
              className="h-10 rounded-xl border-stone-200 bg-white text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="staff-phone" className="text-xs font-semibold text-stone-600">
              Nomor Telepon
            </Label>
            <Input
              id="staff-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="08xxxxxxxxxx"
              disabled={pending}
              className="h-10 rounded-xl border-stone-200 bg-white text-sm"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="staff-email" className="text-xs font-semibold text-stone-600">
              Email Akun
            </Label>
            <Input
              id="staff-email"
              value={initial.email}
              readOnly
              disabled
              className="h-10 rounded-xl border-stone-200 bg-stone-50 text-sm text-stone-500"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end border-t border-stone-100 pt-4">
          <Button
            type="button"
            onClick={save}
            disabled={pending}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[var(--hafta-org-100)] px-5 text-xs font-bold text-[#181700] transition-colors hover:bg-[var(--hafta-org-200)] sm:h-11 sm:w-auto"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan Perubahan
          </Button>
        </div>
      </section>

      <section className="rounded-3xl border border-stone-200/70 bg-white p-4 shadow-[0_8px_30px_rgba(24,23,0,0.05)] sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <Lock className="h-4 w-4 text-stone-500" />
          <h2 className="text-sm font-bold text-[#181700]">Keamanan Akun</h2>
        </div>
        <ChangePasswordForm />
        <SessionManager />
      </section>

      <ImageCropModal
        isOpen={Boolean(cropSource)}
        imageSrc={cropSource}
        title="Atur Foto Profil"
        description="Geser foto untuk mengatur posisi, lalu perbesar atau perkecil. Hasil crop berbentuk persegi dan ditampilkan sebagai avatar bulat."
        onCancel={() => setCropSource(null)}
        onConfirm={(cropped) => {
          setAvatar(cropped);
          setCropSource(null);
          setError(null);
        }}
      />
    </div>
  );
}
