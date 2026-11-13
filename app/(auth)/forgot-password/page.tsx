import { Metadata } from 'next';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export const metadata: Metadata = {
  title: 'Lupa Kata Sandi — Hafta Fisioterapi',
  description: 'Minta tautan reset kata sandi akun Hafta Fisioterapi.',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
