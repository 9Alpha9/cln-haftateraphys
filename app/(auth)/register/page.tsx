import { Metadata } from 'next';
import { RegisterForm } from '@/components/auth/register-form';

export const metadata: Metadata = {
  title: 'Buat Akun — Hafta Fisioterapi',
  description: 'Daftar akun baru Hafta Fisioterapi untuk mengakses patient portal Anda.',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
