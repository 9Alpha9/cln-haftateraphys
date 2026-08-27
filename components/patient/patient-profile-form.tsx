'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
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
}: {
  initialValues: Partial<PatientProfileInput>;
  email: string;
}) {
  const [pending, startTransition] = useTransition();
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
      <section className="space-y-4">
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
            <select
              id="gender"
              disabled={pending}
              className="flex h-10 w-full cursor-pointer appearance-none rounded-lg border border-input bg-background py-2 pl-3 pr-12 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              {...register('gender')}
            >
              <option value="MALE">Laki-laki</option>
              <option value="FEMALE">Perempuan</option>
              <option value="OTHER">Lainnya</option>
            </select>
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
            <Label htmlFor="occupation">Pekerjaan</Label>
            <Input id="occupation" disabled={pending} {...register('occupation')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="addressProvince">Provinsi</Label>
            <select
              id="addressProvince"
              disabled={pending || loadingProvinces}
              defaultValue={initialValues.addressProvince ?? ''}
              className="flex h-10 w-full cursor-pointer appearance-none rounded-lg border border-input bg-background py-2 pl-3 pr-12 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
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
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="addressCity">Kabupaten / Kota</Label>
            <select
              id="addressCity"
              disabled={pending || !regencies.length || loadingRegencies}
              defaultValue={initialValues.addressCity ?? ''}
              className="flex h-10 w-full cursor-pointer appearance-none rounded-lg border border-input bg-background py-2 pl-3 pr-12 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
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
            className="flex min-h-28 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
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
