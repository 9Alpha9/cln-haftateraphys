'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateCurrentPatientProfile } from '@/server/actions/patient-profile';
import type { PatientProfileInput } from '@/lib/validators/patient-profile';

export function PatientProfileForm({
  initialValues,
  email,
}: {
  initialValues: Partial<PatientProfileInput>;
  email: string;
}) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
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
