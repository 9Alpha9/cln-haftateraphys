'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { GlobalSlideOver } from '@/components/ui/global-slide-over';
import { Loader2, UserPlus, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { createPatientFromUser } from '@/server/actions/patients';
import { createUser } from '@/server/actions/create-user';
import { cn } from '@/lib/utils';

type UserOption = { id: string; name: string | null; email: string };

type Mode = 'pick-user' | 'create-user';

export function CreatePatientForm({
  userOptions,
  isOpen,
  onClose,
  onSaved,
}: {
  userOptions: UserOption[];
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('pick-user');
  const [createPending, setCreatePending] = useState(false);
  const router = useRouter();

  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  function clearErrors() {
    setError(null);
    setNameError(null);
    setEmailError(null);
    setPasswordError(null);
  }

  function validateCreateUser(): boolean {
    let valid = true;
    if (!newName.trim()) {
      setNameError('Nama lengkap wajib diisi.');
      valid = false;
    } else {
      setNameError(null);
    }
    if (!newEmail.trim()) {
      setEmailError('Email wajib diisi.');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setEmailError('Format email tidak valid.');
      valid = false;
    } else {
      setEmailError(null);
    }
    if (!newPassword.trim()) {
      setPasswordError('Kata sandi wajib diisi.');
      valid = false;
    } else if (newPassword.length < 12) {
      setPasswordError('Kata sandi minimal 12 karakter.');
      valid = false;
    } else {
      setPasswordError(null);
    }
    return valid;
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const userId = String(new FormData(event.currentTarget).get('userId') ?? '');
    setError(null);
    setPendingSubmit(true);
    startTransition(async () => {
      try {
        await createPatientFromUser(userId);
        router.refresh();
        onSaved?.();
        onClose();
      } catch {
        setError('Pasien tidak dapat ditambahkan. Pilih akun USER yang belum terhubung.');
      } finally {
        setPendingSubmit(false);
      }
    });
  }

  async function handleCreateUser() {
    clearErrors();
    if (!validateCreateUser()) return;
    setCreatePending(true);
    try {
      const result = await createUser({
        name: newName,
        email: newEmail,
        phone: newPhone || undefined,
        password: newPassword,
        role: 'USER',
      });
      if (result.ok) {
        router.refresh();
        onSaved?.();
        onClose();
      } else {
        setError(result.error || 'Gagal membuat akun pasien.');
      }
    } catch {
      setError('Gagal membuat akun pasien.');
    } finally {
      setCreatePending(false);
    }
  }

  return (
    <GlobalSlideOver
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      icon={<UserPlus className="h-5 w-5" />}
      title="Daftarkan Pasien"
      subtitle={mode === 'create-user' ? 'Buat akun USER baru untuk pasien yang belum memilikinya.' : 'Pilih akun USER yang belum terhubung agar dibuatkan record pasien.'}
      footer={
        <div className="flex items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-2">
            {mode === 'create-user' ? (
              <button
                type="button"
                onClick={() => setMode('pick-user')}
                className="h-10 sm:h-11 px-5 rounded-full bg-white hover:bg-stone-100 text-[#181700] border border-stone-200/90 font-semibold text-xs sm:text-[13px] inline-flex items-center justify-center gap-2 cursor-pointer transition-all whitespace-nowrap shrink-0"
              >
                <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
                Kembali
              </button>
            ) : (
              <button
                type="button"
                disabled={createPending}
                onClick={() => setMode('create-user')}
                className="h-10 sm:h-11 px-5 rounded-full bg-white hover:bg-stone-100 text-[#181700] border border-stone-200/90 font-semibold text-xs sm:text-[13px] inline-flex items-center justify-center gap-2 cursor-pointer transition-all whitespace-nowrap shrink-0 disabled:opacity-60"
              >
                {createPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5 shrink-0" />}
                Buat baru
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {mode === 'create-user' ? (
              <button
                type="button"
                disabled={createPending || !newName.trim() || !newEmail.trim() || !newPassword.trim()}
                onClick={handleCreateUser}
                className="h-10 sm:h-11 px-5 rounded-full bg-[var(--hafta-ylw-100)] hover:bg-[var(--hafta-ylw-200)] text-[#181700] font-bold text-xs sm:text-[13px] inline-flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-all whitespace-nowrap shrink-0 disabled:opacity-60"
              >
                {createPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Simpan & Daftarkan
              </button>
            ) : (
              <button
                type="submit"
                form="create-patient-form"
                disabled={pendingSubmit || pending || userOptions.length === 0}
                className="h-10 sm:h-11 px-5 rounded-full bg-[var(--hafta-ylw-100)] hover:bg-[var(--hafta-ylw-200)] text-[#181700] font-bold text-xs sm:text-[13px] inline-flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-all whitespace-nowrap shrink-0"
              >
                {pendingSubmit || pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Simpan & Daftarkan
              </button>
            )}
            <button
              type="button"
              disabled={mode === 'create-user' ? createPending : false}
              onClick={onClose}
              className="h-10 sm:h-11 px-5 rounded-full bg-white hover:bg-stone-100 text-[#181700] border border-stone-200/90 font-semibold text-xs sm:text-[13px] inline-flex items-center justify-center gap-2 cursor-pointer transition-all whitespace-nowrap shrink-0 disabled:opacity-60"
            >
              Batal
            </button>
          </div>
        </div>
      }
    >
      <form id="create-patient-form" onSubmit={submit} className="space-y-5">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {mode === 'pick-user' ? (
          <div className="space-y-2">
            <Label htmlFor="userId">Akun pasien</Label>
            <Select id="userId" name="userId" required disabled={pending || userOptions.length === 0}>
              <option value="">Pilih akun pasien</option>
              {userOptions.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || 'Tanpa nama'} · {user.email}
                </option>
              ))}
            </Select>
            {userOptions.length === 0 ? (
              <p className="text-sm text-stone-500">
                Belum ada akun USER yang tersedia. Klik tombol <strong>Buat akun baru</strong> di bawah untuk membuat akun pasien baru dari nol.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="create-name">Nama lengkap pasien</Label>
              <Input
                id="create-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Masukkan nama lengkap pasien"
                className={cn(
                  'text-xs sm:text-sm border rounded-lg p-2',
                  nameError ? 'border-red-500 focus:ring-red-500' : 'border-stone-200 focus:border-stone-400'
                )}
              />
              {nameError && <p className="text-[11px] text-red-600">{nameError}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="masukkan@email.com"
                className={cn(
                  'text-xs sm:text-sm border rounded-lg p-2',
                  emailError ? 'border-red-500 focus:ring-red-500' : 'border-stone-200 focus:border-stone-400'
                )}
              />
              {emailError && <p className="text-[11px] text-red-600">{emailError}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="create-phone">Nomor telepon (opsional)</Label>
              <Input
                id="create-phone"
                type="tel"
                value={newPhone}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '');
                  setNewPhone(digits.slice(0, 12));
                }}
                placeholder="08123456789"
                className="text-xs sm:text-sm border rounded-lg p-2 border-stone-200 focus:border-stone-400"
                maxLength={12}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="create-password">Kata sandi (minimal 12 karakter)</Label>
              <div className="relative flex items-center">
                <Input
                  id="create-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={cn(
                    'text-xs sm:text-sm border rounded-lg p-2 pr-10',
                    passwordError ? 'border-red-500 focus:ring-red-500' : 'border-stone-200 focus:border-stone-400'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-2 my-auto p-1 text-stone-400 hover:text-stone-600 transition-colors"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordError && <p className="text-[11px] text-red-600">{passwordError}</p>}
            </div>
            <p className="text-[11px] text-stone-500">
              Akun baru akan dibuat dengan peran <strong>Pasien (USER)</strong> dan terhubung otomatis ke Anda sebagai terapis penanggung jawab.
            </p>
          </div>
        )}
      </form>
    </GlobalSlideOver>
  );
}
