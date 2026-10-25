import { Metadata } from 'next';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Masuk — Hafta Fisioterapi',
  description: 'Masuk ke akun Hafta Fisioterapi untuk mengakses patient portal Anda.',
};

export default function LoginPage({ searchParams }: { searchParams: { reason?: string } }) {
  return <LoginForm reason={searchParams.reason} />;
}
