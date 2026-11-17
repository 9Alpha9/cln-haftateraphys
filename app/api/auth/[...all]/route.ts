import { getAuth } from '@/lib/auth';
import { NextRequest } from 'next/server';

async function handleAuth(request: NextRequest) {
  const auth = getAuth();
  const response: Response = 'handler' in auth
    ? await auth.handler(request as unknown as Request)
    : await (auth as unknown as (req: Request) => Promise<Response>)(request as unknown as Request);

  // QA-SEC-30: samakan respons sign-up agar tidak membocorkan keberadaan akun.
  // USER_ALREADY_EXISTS dikembalikan sebagai 422 dengan pesan generik, sama
  // untuk email terdaftar maupun tidak (user enumeration).
  if (request.nextUrl.pathname.startsWith('/api/auth/sign-up')) {
    if (response.status === 422) {
      const body = await response.text();
      if (body.includes('USER_ALREADY_EXISTS')) {
        return new Response(
          JSON.stringify({
            error: 'Pendaftaran tidak dapat diproses. Silakan coba lagi.',
            code: 'REGISTRATION_FAILED',
          }),
          {
            status: 422,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );
      }
    }
  }

  return response;
}

export async function GET(request: NextRequest) {
  return handleAuth(request);
}

export async function POST(request: NextRequest) {
  return handleAuth(request);
}