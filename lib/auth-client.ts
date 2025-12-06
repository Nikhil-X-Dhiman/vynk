'use client';
import { createAuthClient } from 'better-auth/react';
import { emailOTPClient, phoneNumberClient } from 'better-auth/client/plugins';

import { env } from 'process';
export const authClient = createAuthClient({
  baseURL: env.BETTER_AUTH_URL,
  plugins: [emailOTPClient(), phoneNumberClient()],
});
