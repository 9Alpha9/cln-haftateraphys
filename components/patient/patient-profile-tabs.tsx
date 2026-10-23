'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  Camera,
  ChevronRight,
  HeartHandshake,
  Lock,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChangePasswordForm } from '@/components/dashboard/change-password-form';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useWilayahIndonesia } from '@/lib/use-wilayah-indonesia';
import type { PatientProfileInput } from '@/lib/validators/patient-profile';
import { updateCurrentPatientProfile } from '@/server/actions/patient-profile';
import { toast } from 'sonner';

type Props = {
  initialValues: Partial<PatientProfileInput>;
  email: string;
  initialAvatarUrl?: string | null;
  userName?: string;
  emailVerified?: boolean;
};

type SectionId = 'identitas' | 'alamat' | 'darurat' | 'keamanan';

const SECTIONS: {
  id: SectionId;
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  { id: 'identitas', label: 'Identitas Diri', description: 'Nama, kontak, dan pekerjaan', icon: UserRound },
  { id: 'alamat', label: 'Alamat Domisili', description: 'Wilayah dan alamat lengkap', icon: MapPin },
  { id: 'darurat', label: 'Kontak Darurat', description: 'Kontak yang dapat dihubungi', icon: HeartHandshake },
  { id: 'keamanan', label: 'Keamanan', description: 'Kata sandi dan akses akun', icon: Lock },
];

const fieldClass =
  'h-11 rounded-xl border-stone-200 bg-white text-sm shadow-none focus-visible:border-[var(--hafta-ylw-300)] focus-visible:ring-[var(--hafta-ylw-100)]';
const labelClass = 'text-xs font-semibold text-stone-600';

function calculateAge(dateOfBirth?: string) {
  if (!dateOfBirth) return '-';
  const birth = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return '-';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const month = today.getMonth() - birth.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) age -= 1;
  return `${age} tahun`;
}

function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('flex min-w-0 flex-col gap-2', className)}>
      <span className={labelClass}>{label}</span>
      {children}
      {error ? <span className="text-[11px] font-medium text-[var(--hafta-red-600)]">{error}</span> : null}
      {!error && hint ? <span className="text-[11px] leading-relaxed text-stone-400">{hint}</span> : null}
    </label>
  );
}

export function PatientProfileTabs({
  initialValues,
  email,
  initialAvatarUrl,
  userName,
  emailVerified = false,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialAvatarUrl ?? null);
  const [activeSection, setActiveSection] = useState<SectionId>('identitas');
  const fileRef = useRef<HTMLInputElement>(null);
  const {
    provinces,
    regencies,
    selectedProvinceId,
    setSelectedProvinceId,
    loadingProvinces,
    loadingRegencies,
  } = useWilayahIndonesia();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<PatientProfileInput>({
    defaultValues: {
      ...initialValues,
      avatarKey: (initialValues as { avatarKey?: string })?.avatarKey ?? initialAvatarUrl ?? '',
    },
  });

  const values = useWatch({ control }) as PatientProfileInput;
  const fullName = values.fullName || initialValues.fullName || userName || 'Pasien';
  const dateOfBirth = values.dateOfBirth ?? '';
  const completionFields = [
    values.fullName,
    values.phone,
    values.gender,
    values.dateOfBirth,
    values.occupation,
    values.addressProvince,
    values.addressCity,
    values.addressLine,
    values.emergencyContactName,
    values.emergencyContactRelationship,
    values.emergencyContactPhone,
  ];
  const completion = Math.round(
    (completionFields.filter((value) => Boolean(String(value ?? '').trim())).length /
      completionFields.length) *
      100,
  );

  useEffect(() => {
    if (!provinces.length || selectedProvinceId) return;
    const match = provinces.find((province) => province.name === initialValues.addressProvince);
    if (match) setSelectedProvinceId(match.id);
  }, [initialValues.addressProvince, provinces, selectedProvinceId, setSelectedProvinceId]);

  function compressImage(file: File, maxWidth = 256, quality = 0.7): Promise<string> {
    return new Promise((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => {
        const scale = Math.min(1, maxWidth / Math.max(image.width, image.height));
        const width = Math.round(image.width * scale);
        const height = Math.round(image.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (!context) return reject(new Error('Canvas tidak tersedia'));
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      image.onerror = () => reject(new Error('Gagal memuat gambar'));
      const reader = new FileReader();
      reader.onload = () => {
        image.src = String(reader.result);
      };
      reader.onerror = () => reject(new Error('Gagal membaca file'));
      reader.readAsDataURL(file);
    });
  }

  async function onAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Format foto harus JPG, PNG, atau WebP.');
      return;
    }
    try {
      const dataUrl = await compressImage(file);
      setAvatarPreview(dataUrl);
      setValue('avatarKey', dataUrl, { shouldDirty: true });
      toast.success('Foto siap disimpan. Klik Simpan Perubahan.');
    } catch {
      toast.error('Gagal memproses foto.');
    }
  }

  function onSubmit(data: PatientProfileInput) {
    startTransition(async () => {
      try {
        await updateCurrentPatientProfile(data);
        toast.success('Profil berhasil diperbarui.');
        const nextAvatar = data.avatarKey || avatarPreview || null;
        reset(data);
        setAvatarPreview(nextAvatar);
        window.dispatchEvent(new CustomEvent('hafta:avatar', { detail: { avatarUrl: nextAvatar } }));
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Data profil tidak dapat disimpan. Periksa isian lalu coba lagi.';
        toast.error(message);
      }
    });
  }

  function resetForm() {
    reset({
      ...initialValues,
      avatarKey: (initialValues as { avatarKey?: string })?.avatarKey ?? initialAvatarUrl ?? '',
    });
    setAvatarPreview(initialAvatarUrl ?? null);
    const initialProvince = provinces.find((province) => province.name === initialValues.addressProvince);
    setSelectedProvinceId(initialProvince?.id ?? '');
    toast.success('Perubahan dibatalkan.');
  }

  const activeSectionMeta = SECTIONS.find((section) => section.id === activeSection) ?? SECTIONS[0];
  const ActiveSectionIcon = activeSectionMeta.icon;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <aside className="min-w-0 space-y-4 lg:col-span-4 lg:sticky lg:top-[88px] lg:self-start">
        <section className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="relative h-24 w-24 shrink-0">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#FAFAF8] text-2xl font-bold text-[#181700] ring-1 ring-stone-200">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarPreview} alt="Foto profil" className="h-full w-full object-cover" />
                ) : (
                  fullName[0]?.toUpperCase() ?? 'P'
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-0.5 -right-0.5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[#181700] text-[var(--hafta-ylw-100)] ring-4 ring-white transition-colors hover:bg-[var(--hafta-ylw-100)] hover:text-[#181700]"
                aria-label="Ubah foto profil"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={onAvatarChange}
              />
              <input type="hidden" {...register('avatarKey')} />
            </div>

            <div className="min-w-0 pt-1">
              <h2 className="truncate text-lg font-bold text-[#181700]">{fullName}</h2>
              <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-stone-500">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{email}</span>
              </p>
              <span
                className={cn(
                  'mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold',
                  emailVerified
                    ? 'bg-[var(--hafta-grn-50)] text-[var(--hafta-grn-700)]'
                    : 'bg-[var(--hafta-org-50)] text-[var(--hafta-org-700)]',
                )}
              >
                <ShieldCheck className="h-3 w-3" />
                {emailVerified ? 'Akun terverifikasi' : 'Email belum diverifikasi'}
              </span>
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-[#FAFAF8] p-4">
            <div>
              <dt className="text-[10px] font-medium uppercase tracking-wide text-stone-400">No. RM</dt>
              <dd className="mt-1 font-mono text-xs font-bold text-[#181700]">
                {initialValues.medicalRecordNumber || 'Belum tersedia'}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-medium uppercase tracking-wide text-stone-400">Usia</dt>
              <dd className="mt-1 text-xs font-bold text-[#181700]">{calculateAge(dateOfBirth)}</dd>
            </div>
          </dl>

          <div className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-stone-600">Kelengkapan profil</span>
              <span className="font-mono text-xs font-bold text-[#181700]">{completion}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full bg-[var(--hafta-ylw-100)] transition-all duration-300"
                style={{ width: `${completion}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-stone-400">
              Data lengkap membantu fisioterapis menyiapkan asesmen yang tepat.
            </p>
          </div>

          <nav className="mt-5 hidden gap-1.5 lg:flex lg:flex-col" aria-label="Bagian profil">
            {SECTIONS.map(({ id, label, description, icon: Icon }) => {
              const isActive = activeSection === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveSection(id)}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors',
                    isActive
                      ? 'bg-[#181700] text-white'
                      : 'text-stone-600 hover:bg-[#FAFAF8] hover:text-[#181700]',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                      isActive
                        ? 'bg-white/10 text-[var(--hafta-ylw-100)]'
                        : 'bg-stone-100 text-stone-500',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold">{label}</span>
                    <span
                      className={cn(
                        'mt-0.5 block truncate text-[10px]',
                        isActive ? 'text-stone-400' : 'text-stone-400',
                      )}
                    >
                      {description}
                    </span>
                  </span>
                  <ChevronRight
                    className={cn('h-4 w-4 shrink-0', isActive ? 'text-[var(--hafta-ylw-100)]' : 'text-stone-300')}
                  />
                </button>
              );
            })}
          </nav>
        </section>
      </aside>

      <section className="flex min-w-0 flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white lg:col-span-8">
        <div className="border-b border-stone-200 p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-stone-100 p-1.5 lg:hidden" role="tablist" aria-label="Bagian profil">
            {SECTIONS.map(({ id, label, icon: Icon }) => {
              const isActive = activeSection === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveSection(id)}
                  className={cn(
                    'flex min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[11px] font-semibold transition-colors',
                    isActive
                      ? 'bg-[#181700] text-white'
                      : 'bg-white text-stone-500 hover:text-[#181700]',
                  )}
                >
                  <Icon className={cn('h-3.5 w-3.5 shrink-0', isActive && 'text-[var(--hafta-ylw-100)]')} />
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-start gap-3 lg:mt-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--hafta-ylw-50)] text-[#181700]">
              <ActiveSectionIcon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-[#181700]">{activeSectionMeta.label}</h3>
              <p className="mt-1 text-xs leading-relaxed text-stone-500">
                {activeSectionMeta.description}
              </p>
            </div>
          </div>
        </div>

        {activeSection === 'keamanan' ? (
          <div className="p-5 sm:p-8">
            <ChangePasswordForm />
          </div>
        ) : (
          <form className="flex flex-1 flex-col" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex-1 p-5 sm:p-8">
              {activeSection === 'identitas' ? (
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Nama lengkap" error={errors.fullName?.message}>
                    <Input
                      disabled={pending}
                      className={fieldClass}
                      {...register('fullName', { required: 'Nama lengkap wajib diisi.' })}
                    />
                  </Field>
                  <Field label="Nama panggilan">
                    <Input disabled={pending} className={fieldClass} {...register('preferredName')} />
                  </Field>
                  <Field label="Email akun" hint="Email tidak dapat diubah di halaman ini.">
                    <Input value={email} disabled className={cn(fieldClass, 'bg-stone-50 text-stone-500')} />
                  </Field>
                  <Field label="Nomor rekam medis" hint="Dibuat otomatis oleh sistem.">
                    <Input
                      value={initialValues.medicalRecordNumber ?? ''}
                      disabled
                      placeholder="Belum tersedia"
                      className={cn(fieldClass, 'bg-stone-50 font-mono text-stone-500')}
                    />
                  </Field>
                  <Field label="Jenis kelamin">
                    <Select
                      disabled={pending}
                      className="w-full"
                      selectClassName={cn(fieldClass, 'pr-10')}
                      {...register('gender')}
                    >
                      <option value="MALE">Laki-laki</option>
                      <option value="FEMALE">Perempuan</option>
                      <option value="OTHER">Lainnya</option>
                    </Select>
                  </Field>
                  <Field label="Tanggal lahir">
                    <Controller
                      control={control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <DatePicker
                          value={field.value ?? ''}
                          onChange={field.onChange}
                          disabled={pending}
                          className={fieldClass}
                        />
                      )}
                    />
                  </Field>
                  <Field label="Usia" hint="Dihitung otomatis dari tanggal lahir.">
                    <Input value={calculateAge(dateOfBirth)} disabled className={cn(fieldClass, 'bg-stone-50 text-stone-500')} />
                  </Field>
                  <Field label="Pekerjaan">
                    <Input disabled={pending} className={fieldClass} {...register('occupation')} />
                  </Field>
                  <Field label="Nomor telepon" className="sm:col-span-2">
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                      <Input
                        type="tel"
                        inputMode="numeric"
                        maxLength={13}
                        disabled={pending}
                        className={cn(fieldClass, 'pl-9')}
                        {...register('phone')}
                        onChange={(event) => {
                          const digits = event.target.value.replace(/\D/g, '').slice(0, 13);
                          setValue('phone', digits, { shouldDirty: true });
                        }}
                      />
                    </div>
                  </Field>
                </div>
              ) : null}

              {activeSection === 'alamat' ? (
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Provinsi">
                    <Controller
                      control={control}
                      name="addressProvince"
                      render={({ field }) => {
                        const selectedProvince =
                          provinces.find((province) => province.name === field.value)?.id ??
                          selectedProvinceId;
                        return (
                          <Select
                            value={selectedProvince}
                            disabled={pending || loadingProvinces}
                            className="w-full"
                            selectClassName={cn(fieldClass, 'pr-10')}
                            onChange={(event) => {
                              const provinceId = event.target.value;
                              const province = provinces.find((item) => item.id === provinceId);
                              setSelectedProvinceId(provinceId);
                              field.onChange(province?.name ?? '');
                              setValue('addressCity', '', { shouldDirty: true });
                            }}
                          >
                            <option value="">
                              {loadingProvinces ? 'Memuat provinsi...' : 'Pilih provinsi'}
                            </option>
                            {provinces.map((province) => (
                              <option key={province.id} value={province.id}>
                                {province.name}
                              </option>
                            ))}
                          </Select>
                        );
                      }}
                    />
                  </Field>
                  <Field label="Kabupaten / Kota">
                    <Controller
                      control={control}
                      name="addressCity"
                      render={({ field }) => (
                        <Select
                          value={field.value ?? ''}
                          disabled={pending || !regencies.length || loadingRegencies}
                          className="w-full"
                          selectClassName={cn(fieldClass, 'pr-10')}
                          onChange={(event) => field.onChange(event.target.value)}
                        >
                          <option value="">
                            {loadingRegencies ? 'Memuat kabupaten/kota...' : 'Pilih kabupaten / kota'}
                          </option>
                          {regencies.map((regency) => (
                            <option key={regency.id} value={regency.name}>
                              {regency.name}
                            </option>
                          ))}
                        </Select>
                      )}
                    />
                  </Field>
                  <Field
                    label="Alamat lengkap"
                    hint="Sertakan nama jalan, nomor, RT/RW, kelurahan, dan kecamatan."
                    className="sm:col-span-2"
                  >
                    <textarea
                      disabled={pending}
                      className="flex min-h-28 w-full resize-none rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm leading-relaxed outline-none transition-colors placeholder:text-stone-400 focus-visible:border-[var(--hafta-ylw-300)] focus-visible:ring-2 focus-visible:ring-[var(--hafta-ylw-100)] disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-500"
                      placeholder="Jl. Nama Jalan No. RT/RW, Kelurahan, Kecamatan"
                      {...register('addressLine')}
                    />
                  </Field>
                </div>
              ) : null}

              {activeSection === 'darurat' ? (
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Nama kontak">
                    <Input
                      disabled={pending}
                      className={fieldClass}
                      placeholder="Nama lengkap"
                      {...register('emergencyContactName')}
                    />
                  </Field>
                  <Field label="Hubungan">
                    <Input
                      disabled={pending}
                      className={fieldClass}
                      placeholder="Orang tua / Pasangan / Saudara"
                      {...register('emergencyContactRelationship')}
                    />
                  </Field>
                  <Field label="Nomor telepon kontak" className="sm:col-span-2">
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                      <Input
                        type="tel"
                        disabled={pending}
                        className={cn(fieldClass, 'pl-9')}
                        placeholder="08xxxxxxxxxx"
                        {...register('emergencyContactPhone')}
                      />
                    </div>
                  </Field>
                </div>
              ) : null}
            </div>

            <footer className="flex flex-col-reverse gap-3 border-t border-stone-100 bg-[#FAFAF8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <p className="text-[11px] text-stone-400">
                {isDirty ? 'Ada perubahan yang belum disimpan.' : 'Data profil Anda tersimpan dengan aman.'}
              </p>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending || !isDirty}
                  onClick={resetForm}
                  className="h-10 w-full whitespace-nowrap rounded-full border-stone-200 px-5 text-xs font-semibold sm:w-auto"
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  disabled={pending || !isDirty}
                  className="h-10 w-full gap-2 whitespace-nowrap rounded-full bg-[#181700] px-5 text-xs font-bold text-white hover:bg-[var(--hafta-ylw-100)] hover:text-[#181700] sm:w-auto"
                >
                  {pending ? <CalendarDays className="h-4 w-4 animate-pulse" /> : <Save className="h-4 w-4" />}
                  {pending ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </div>
            </footer>
          </form>
        )}
      </section>
    </div>
  );
}
