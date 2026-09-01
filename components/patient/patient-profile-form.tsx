'use client';

import { useRef, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { Camera, User } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { updateCurrentPatientProfile } from '@/server/actions/patient-profile';
import type { PatientProfileInput } from '@/lib/validators/patient-profile';
import { useWilayahIndonesia } from '@/lib/use-wilayah-indonesia';

export function PatientProfileForm({
  initialValues,
  email,
  initialAvatarUrl,
}: {
  initialValues: Partial<PatientProfileInput>;
  email: string;
  initialAvatarUrl?: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialAvatarUrl ?? null);
  const fileRef = useRef<HTMLInputElement>(null);
  const {
    provinces,
    regencies,
    setSelectedProvinceId,
    loadingProvinces,
    loadingRegencies,
  } = useWilayahIndonesia();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitSuccessful },
    setError,
  } = useForm<PatientProfileInput>({ defaultValues: initialValues });

  function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('root', { message: 'Ukuran foto maksimal 2MB.' });
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('root', { message: 'Format foto harus JPG, PNG, atau WebP.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? '');
      setAvatarPreview(dataUrl);
      setValue('avatarKey', dataUrl, { shouldDirty: true });
    };
    reader.readAsDataURL(file);
  }

  return (
    <form
      className="space-y-8"
      onSubmit={handleSubmit((data) =>
        startTransition(async () => {
          try {
            await updateCurrentPatientProfile(data);
          } catch {
            setError('root', { message: 'Data profil tidak dapat disimpan. Periksa isian lalu coba lagi.' });
          }
        }),
      )}
    >
      {isSubmitSuccessful ? (
        <Alert variant="success">
          <AlertDescription>Data profil berhasil disimpan.</AlertDescription>
        </Alert>
      ) : null}
      {errors.root ? (
        <Alert variant="destructive">
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      ) : null}
      <section className="space-y-5">
        <div className="flex flex-col gap-5 rounded-2xl border border-accent/20 bg-accent/[0.04] p-5 sm:flex-row sm:items-center">
          <div className="relative mx-auto sm:mx-0">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white shadow-sm">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Foto profil" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-accent/15 text-2xl font-bold text-[#92400e]">
                  {(initialValues.fullName ?? email)?.[0]?.toUpperCase() ?? <User className="h-8 w-8" />}
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
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-sm font-bold text-foreground">Foto Profil</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              JPG, PNG maksimal 2MB. Klik ikon kamera untuk mengganti foto.
            </p>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onAvatarChange} />
            <div className="mt-3 flex justify-center gap-2 sm:justify-start">
              <Button type="button" size="sm" onClick={() => fileRef.current?.click()} className="bg-accent text-accent-foreground hover:bg-accent/90">
                Pilih Foto
              </Button>
              {avatarPreview ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAvatarPreview(null);
                    setValue('avatarKey', '', { shouldDirty: true });
                    if (fileRef.current) fileRef.current.value = '';
                  }}
                >
                  Hapus
                </Button>
              ) : null}
            </div>
          </div>
        </div>
        <div>
          <h2 className="font-semibold text-foreground">Identitas & Kontak</h2>
          <p className="text-sm text-muted-foreground">
            Email akun dikelola melalui pengaturan akun dan tidak dapat diubah dari form ini.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nama lengkap *</Label>
            <Input
              id="fullName"
              disabled={pending}
              {...register('fullName', { required: 'Nama lengkap wajib diisi.' })}
            />
            {errors.fullName ? <p className="text-sm text-destructive">{errors.fullName.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Jenis Kelamin</Label>
            <Select disabled={pending} {...register('gender')}>
              <option value="MALE">Laki-laki</option>
              <option value="FEMALE">Perempuan</option>
              <option value="OTHER">Lainnya</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="medicalRecordNumber">No. Rekam Medis</Label>
            <Input id="medicalRecordNumber" disabled={pending} {...register('medicalRecordNumber')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="preferredName">Nama panggilan</Label>
            <Input id="preferredName" disabled={pending} {...register('preferredName')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email akun</Label>
            <Input id="email" value={email} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Nomor telepon</Label>
            <Input id="phone" type="tel" disabled={pending} {...register('phone')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Tanggal lahir</Label>
            <Input id="dateOfBirth" type="date" disabled={pending} {...register('dateOfBirth')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="age">Usia</Label>
            <Input
              id="age"
              disabled
              value={(initialValues.dateOfBirth ? new Date().getFullYear() - new Date(initialValues.dateOfBirth).getFullYear() : '-') + ' tahun'}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="occupation">Pekerjaan</Label>
            <Input id="occupation" disabled={pending} {...register('occupation')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="addressProvince">Provinsi</Label>
            <Select
              disabled={pending || loadingProvinces}
              defaultValue={initialValues.addressProvince ?? ''}
              {...register('addressProvince')}
              onChange={(event) => {
                setSelectedProvinceId(event.target.value);
                setValue('addressProvince', provinces.find((province) => province.id === event.target.value)?.name ?? '');
                setValue('addressCity', '');
              }}
            >
              <option value="">{loadingProvinces ? 'Memuat provinsi...' : 'Pilih provinsi'}</option>
              {provinces.map((province) => (
                <option key={province.id} value={province.id}>{province.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="addressCity">Kabupaten / Kota</Label>
            <select
              id="addressCity"
              disabled={pending || !regencies.length || loadingRegencies}
              defaultValue={initialValues.addressCity ?? ''}
              className="flex h-10 w-full cursor-pointer appearance-none rounded-lg border border-input bg-background py-2 pl-3 pr-12 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
              {...register('addressCity')}
              onChange={(event) => setValue('addressCity', event.target.value)}
            >
              <option value="">{loadingRegencies ? 'Memuat kabupaten/kota...' : 'Pilih kabupaten / kota'}</option>
              {regencies.map((regency) => (
                <option key={regency.id} value={regency.name}>{regency.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="addressLine">Alamat</Label>
          <textarea
            id="addressLine"
            disabled={pending}
            className="flex min-h-28 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
            {...register('addressLine')}
          />
        </div>
      </section>
      <section className="space-y-4 border-t border-border pt-6">
        <div>
          <h2 className="font-semibold text-foreground">Kontak Darurat</h2>
          <p className="text-sm text-muted-foreground">Isi bila diperlukan untuk kelancaran layanan.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="emergencyContactName">Nama kontak</Label>
            <Input id="emergencyContactName" disabled={pending} {...register('emergencyContactName')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyContactRelationship">Hubungan</Label>
            <Input id="emergencyContactRelationship" disabled={pending} {...register('emergencyContactRelationship')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyContactPhone">Nomor telepon kontak</Label>
            <Input id="emergencyContactPhone" type="tel" disabled={pending} {...register('emergencyContactPhone')} />
          </div>
        </div>
      </section>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? 'Menyimpan...' : 'Simpan Data'}
        </Button>
      </div>
    </form>
  );
}
