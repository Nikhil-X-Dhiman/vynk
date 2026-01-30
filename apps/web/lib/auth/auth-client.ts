// 'use client';
import { createAuthClient } from 'better-auth/client';
import { phoneNumberClient } from 'better-auth/client/plugins';
import { User, Session } from 'better-auth';

// import { createAuthClient, phoneNumberClient } from '@repo/auth';
const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL, // Ensure this env var exists or defaults
  plugins: [phoneNumberClient()],
});

export { authClient };
export type { User, Session };
