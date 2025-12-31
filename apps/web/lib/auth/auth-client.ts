// 'use client';
// import { createAuthClient } from 'better-auth/react';
// import { phoneNumberClient } from 'better-auth/client/plugins';

import { createAuthClient, phoneNumberClient } from '@repo/auth';
import { env } from 'process';
export const authClient = createAuthClient({
  baseURL: env.BETTER_AUTH_URL,
  plugins: [phoneNumberClient()],
});
