import { NextResponse } from 'next/server';

const API_BASE = 'https://emsifa.github.io/api-wilayah-indonesia/api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provinceId = searchParams.get('provinceId');
  const endpoint = provinceId ? `${API_BASE}/regencies/${encodeURIComponent(provinceId)}.json` : `${API_BASE}/provinces.json`;

  try {
    const response = await fetch(endpoint, { next: { revalidate: 86400 } });
    if (!response.ok) return NextResponse.json({ error: 'Wilayah tidak tersedia.' }, { status: 502 });
    return NextResponse.json(await response.json(), {
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
    });
  } catch {
    return NextResponse.json({ error: 'Gagal mengambil data wilayah.' }, { status: 502 });
  }
}
