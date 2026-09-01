'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Camera, User, Shield, MapPin, Phone, Mail, Briefcase, Calendar, Heart, Lock, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select } from '@/components/ui/select';
import { ChangePasswordForm } from '@/components/dashboard/change-password-form';
import { updateCurrentPatientProfile } from '@/server/actions/patient-profile';
import type { PatientProfileInput } from '@/lib/validators/patient-profile';
import { useWilayahIndonesia } from '@/lib/use-wilayah-indonesia';
import { toast } from 'sonner';

type Props = {
  initialValues: Partial<PatientProfileInput>;
  email: string;
  initialAvatarUrl?: string | null;
  userName?: string;
};

export function PatientProfileTabs({ initialValues, email, initialAvatarUrl, userName }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialAvatarUrl ?? null);
  const [activeTab, setActiveTab] = useState('profil');
  const fileRef = useRef<HTMLInputElement>(null);
  const { provinces, regencies, setSelectedProvinceId, loadingProvinces, loadingRegencies } = useWilayahIndonesia();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<PatientProfileInput>({ defaultValues: { ...initialValues, avatarKey: (initialValues as { avatarKey?: string })?.avatarKey ?? (initialAvatarUrl ?? '') } });

  const fullNameWatch = watch('fullName') || initialValues.fullName || userName || '';

  useEffect(() => {
    setAvatarPreview(initialAvatarUrl ?? null);
  }, [initialAvatarUrl]);

  function compressImage(file: File, maxW = 256, quality = 0.7): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas tidak tersedia'));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Gagal memuat gambar'));
      const r = new FileReader();
      r.onload = () => { img.src = String(r.result); };
      r.onerror = () => reject(new Error('Gagal membaca file'));
      r.readAsDataURL(file);
    });
  }

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
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
        const nextAvatar = (data.avatarKey as string) || avatarPreview || null;
        reset(data);
        setAvatarPreview(nextAvatar);
        window.dispatchEvent(new CustomEvent('hafta:avatar', { detail: { avatarUrl: nextAvatar } }));
        router.refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Data profil tidak dapat disimpan. Periksa isian lalu coba lagi.';
        toast.error(msg);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="h-28 sm:h-36 bg-gradient-to-r from-accent/20 via-accent/10 to-accent/5 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.15),transparent_50%)]" />
        </div>
        <div className="px-5 sm:px-8 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-10">
            <div className="relative mx-auto sm:mx-0 shrink-0">
              <div className="flex h-[96px] w-[96px] sm:h-[112px] sm:w-[112px] items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow-md">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Foto profil" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-accent/15 text-2xl font-bold text-[#92400e]">
                    {(fullNameWatch as string)?.[0]?.toUpperCase() || email?.[0]?.toUpperCase() || <User className="h-8 w-8" />}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white text-[#92400e] shadow-sm hover:bg-accent hover:text-accent-foreground"
                aria-label="Ubah foto profil"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onAvatarChange} />
              <input type="hidden" {...register('avatarKey')} />
            </div>
            <div className="flex-1 text-center sm:text-left min-w-0 pb-1">
              <h2 className="text-lg sm:text-xl font-bold text-foreground truncate">{fullNameWatch || 'Nama Pasien'}</h2>
              <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{email}</span>
              </p>
              {initialValues.medicalRecordNumber ? (
                <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#92400e]">
                  RM: {initialValues.medicalRecordNumber}
                </p>
              ) : null}
            </div>
            <div className="flex justify-center sm:justify-end gap-2 shrink-0">
              <Button type="button" size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-5" onClick={() => fileRef.current?.click()}>
                Ganti Foto
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="profil" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0 scrollbar-none">
            <TabsList className="inline-flex h-11 w-auto items-center justify-start rounded-full border border-accent/20 bg-accent/10 p-1.5 gap-1">
              <TabsTrigger value="profil" className="rounded-full px-4 sm:px-5 text-xs sm:text-sm font-semibold text-[#92400e]/70 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-sm">
                Profil
              </TabsTrigger>
              <TabsTrigger value="alamat" className="rounded-full px-4 sm:px-5 text-xs sm:text-sm font-semibold text-[#92400e]/70 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-sm">
                Alamat
              </TabsTrigger>
              <TabsTrigger value="darurat" className="rounded-full px-4 sm:px-5 text-xs sm:text-sm font-semibold text-[#92400e]/70 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-sm">
                Kontak Darurat
              </TabsTrigger>
              <TabsTrigger value="keamanan" className="rounded-full px-4 sm:px-5 text-xs sm:text-sm font-semibold text-[#92400e]/70 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-sm">
                Keamanan
              </TabsTrigger>
            </TabsList>
          </div>
          {activeTab !== 'keamanan' && isDirty ? (
            <Button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={pending}
              className="w-full sm:w-auto shrink-0 bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-6 shadow-sm"
            >
              {pending ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          ) : null}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
          {errors.fullName ? (
            <p className="text-xs text-destructive">{errors.fullName.message}</p>
          ) : null}

          <TabsContent value="profil" className="mt-0 space-y-6 focus-visible:outline-none">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <Card className="rounded-2xl border-border/20">
                  <CardHeader className="pb-4 border-b border-border/60">
                    <CardTitle className="text-base font-bold">
                      Identitas Diri
                    </CardTitle>
                    <CardDescription className="text-xs">Informasi dasar yang digunakan untuk layanan klinik.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium">Nama lengkap *</span>
                        <Input disabled={pending} {...register('fullName', { required: 'Nama lengkap wajib diisi.' })} />
                        {errors.fullName ? <p className="text-xs text-destructive">{errors.fullName.message}</p> : null}
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium">Email akun</span>
                        <Input value={email} disabled />
                        <p className="text-[11px] text-muted-foreground">Email tidak dapat diubah di sini.</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium">Nama panggilan</span>
                        <Input disabled={pending} {...register('preferredName')} />
                      </div>
<div className="flex flex-col gap-2">
                        <span className="text-sm font-medium">Jenis Kelamin</span>
                        <Select disabled={pending} {...register('gender')}>
                          <option value="MALE">Laki-laki</option>
                          <option value="FEMALE">Perempuan</option>
                          <option value="OTHER">Lainnya</option>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium">Tanggal lahir</span>
                        <Input type="date" disabled={pending} {...register('dateOfBirth')} />
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium">Usia</span>
                        <Input
                          disabled
                          value={(watch('dateOfBirth') ? new Date().getFullYear() - new Date(String(watch('dateOfBirth'))).getFullYear() : '-') + ' tahun'}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium">Pekerjaan</span>
                        <Input disabled={pending} {...register('occupation')} />
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium">Nomor telepon</span>
                        <Input
                          type="tel"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={13}
                          disabled={pending}
                          {...register('phone')}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, '').slice(0, 13);
                            e.target.value = digits;
                            e.nativeEvent.stopImmediatePropagation();
                            // @ts-ignore - react-hook-form internal
                            register('phone').onChange({ target: { value: digits, name: 'phone' } });
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="rounded-2xl border-accent/20 bg-accent/[0.03]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold">Ringkasan</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs leading-relaxed">
                    <div className="flex justify-between border-b border-border/40 pb-2"><span className="text-muted-foreground">Email</span><span className="font-medium truncate ml-2">{email}</span></div>
                    <div className="flex justify-between border-b border-border/40 pb-2"><span className="text-muted-foreground">Telepon</span><span className="font-medium">{watch('phone') || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Tgl Lahir</span><span className="font-medium">{watch('dateOfBirth') || '-'}</span></div>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold">Kontak Darurat</CardTitle>
                    <CardDescription className="text-xs">Ringkasan singkat.</CardDescription>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground leading-relaxed">
                    {watch('emergencyContactName') || watch('emergencyContactPhone') ? (
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">{watch('emergencyContactName') || '-'}</p>
                        <p>{watch('emergencyContactRelationship') || '-'}</p>
                        <p>{watch('emergencyContactPhone') || '-'}</p>
                      </div>
                    ) : (
                      <p>Belum ada kontak darurat.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="alamat" className="mt-0 space-y-6 focus-visible:outline-none">
            <Card className="rounded-2xl border-border/20">
              <CardHeader className="border-b border-border/60">
                <CardTitle className="text-base font-bold">Alamat Domisili</CardTitle>
                <CardDescription className="text-xs">Lengkapi alamat untuk keperluan administrasi & kunjungan.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium">Provinsi</span>
                    <Select
                      disabled={pending || loadingProvinces}
                      defaultValue={initialValues.addressProvince ?? ''}
                      {...register('addressProvince')}
                      onChange={(e) => {
                        const provinceId = e.target.value;
                        setSelectedProvinceId(provinceId);
                        setValue('addressCity', '');
                      }}
                    >
                      <option value="">{loadingProvinces ? 'Memuat provinsi...' : 'Pilih provinsi'}</option>
                      {provinces.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium">Kabupaten / Kota</span>
                    <Select
                      disabled={pending || !regencies.length || loadingRegencies}
                      defaultValue={initialValues.addressCity ?? ''}
                      {...register('addressCity')}
                      onChange={(e) => setValue('addressCity', e.target.value)}
                    >
                      <option value="">{loadingRegencies ? 'Memuat kabupaten/kota...' : 'Pilih kabupaten / kota'}</option>
                      {regencies.map((r) => (
                        <option key={r.id} value={r.name}>{r.name}</option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Alamat lengkap</span>
                  <textarea
                    disabled={pending}
                    className="flex min-h-28 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-60"
                    {...register('addressLine')}
                    placeholder="Jl. Nama Jalan No. RT/RW, Kelurahan, Kecamatan"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="darurat" className="mt-0 space-y-6 focus-visible:outline-none">
            <Card className="rounded-2xl border-border/20">
              <CardHeader className="border-b border-border/60">
                <CardTitle className="text-base font-bold">Kontak Darurat</CardTitle>
                <CardDescription className="text-xs">Isi bila diperlukan untuk kelancaran layanan.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium">Nama kontak</span>
                    <Input disabled={pending} {...register('emergencyContactName')} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium">Hubungan</span>
                    <Input disabled={pending} {...register('emergencyContactRelationship')} placeholder="Orang tua / Pasangan / Saudara" />
                  </div>
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <span className="text-sm font-medium">Nomor telepon kontak</span>
                    <Input type="tel" disabled={pending} {...register('emergencyContactPhone')} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </form>

        <TabsContent value="keamanan" className="space-y-6 focus-visible:outline-none">
          <Card className="rounded-2xl border-accent/20">
            <CardHeader className="border-b border-border/60">
              <CardTitle className="text-base font-bold">Ubah Kata Sandi</CardTitle>
              <CardDescription className="text-xs">Ganti kata sandi anda untuk keamanan akun.</CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <ChangePasswordForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
