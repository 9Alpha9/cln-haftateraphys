import { NextResponse } from 'next/server';
import { getFeaturableReviews } from '@/lib/featurable';

export const revalidate = 60;

export async function GET() {
  const data = await getFeaturableReviews();
  return NextResponse.json(data);
}
