import { NextResponse } from 'next/server';
import { getDashboardStats } from '@/server/queries/dashboard-stats';
import { ForbiddenError, UnauthenticatedError } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await getDashboardStats();
    return NextResponse.json(stats);
  } catch (error) {
    if (error instanceof UnauthenticatedError || error instanceof ForbiddenError) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}
