import { Metadata } from 'next';
import { RegisterForm } from '@/components/auth/register-form';

export const metadata: Metadata = {
  title: 'Buat Akun — Hafta Fisioterapi',
  description: 'Daftar akun baru Hafta Fisioterapi untuk mengakses patient portal.',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
