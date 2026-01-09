// 'use client';
import { createAuthClient } from 'better-auth/react';
import { phoneNumberClient } from 'better-auth/client/plugins';
import { User, Session } from 'better-auth';

// import { createAuthClient, phoneNumberClient } from '@repo/auth';
import { env } from 'process';
const authClient = createAuthClient({
  baseURL: env.BETTER_AUTH_URL,
  plugins: [phoneNumberClient()],
});

export { authClient };
export type { User, Session };
