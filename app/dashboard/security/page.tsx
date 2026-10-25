import { redirect } from 'next/navigation';

export default function SecurityPage() {
  redirect('/dashboard/profile?tab=security');
}
