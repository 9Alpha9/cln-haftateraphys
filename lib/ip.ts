import { headers } from 'next/headers';

export async function getIpAddress(): Promise<string | null> {
  try {
    const headersList = await headers();
    return (
      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      headersList.get('x-real-ip') ??
      null
    );
  } catch {
    return null;
  }
}
