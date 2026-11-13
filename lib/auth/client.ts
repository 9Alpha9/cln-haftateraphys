import { createAuthClient } from 'better-auth/react';
import { twoFactorClient } from 'better-auth/client/plugins';

const appUrl = process.env.NEXT_PUBLIC_APP_URL;

export const authClient = createAuthClient({
  // When NEXT_PUBLIC_APP_URL is unset, omit baseURL so better-auth uses the
  // browser's own origin. Hardcoding a localhost fallback breaks any deployed
  // app by posting auth requests to the wrong origin (CORS).
  ...(appUrl ? { baseURL: appUrl } : {}),
  plugins: [twoFactorClient()],
});

export const { getSession, signIn, signUp, signOut, useSession } = authClient;
