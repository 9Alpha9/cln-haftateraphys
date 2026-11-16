import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { profiles } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';

export const dynamic = 'force-dynamic';

/** Avatar publik milik pengguna yang sedang login (tidak pernah mengekspos data pasien). */
export async function GET() {
  try {
    const { session } = await requireSession({ redirectToLogin: false });
    const [profile] = await getDb()
      .select({ avatarKey: profiles.avatarKey })
      .from(profiles)
      .where(eq(profiles.userId, session.user.id))
      .limit(1);

    return NextResponse.json(
      { avatarUrl: profile?.avatarKey ?? null },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json({ avatarUrl: null }, { status: 401 });
  }
}
