import { createAuthClient } from 'better-auth/react';

const appUrl = process.env.NEXT_PUBLIC_APP_URL;

export const authClient = createAuthClient({
  // When NEXT_PUBLIC_APP_URL is unset, omit baseURL so better-auth uses the
  // browser's own origin. Hardcoding a localhost fallback breaks any deployed
  // app by posting auth requests to the wrong origin (CORS).
  ...(appUrl ? { baseURL: appUrl } : {}),
});

export const { signIn, signUp, signOut, useSession } = authClient;
