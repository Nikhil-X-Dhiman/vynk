/**
 * @fileoverview Better Auth Catch-All Route Handler
 *
 * Proxies all `/api/auth/*` requests to the Better Auth server instance.
 * This single route handles every auth endpoint including:
 * - Phone number OTP (send/verify)
 * - Session management (get/revoke)
 * - Sign in / sign out
 *
 * @module app/api/auth/[...all]/route
 *
 * @see {@link @repo/auth} for the full auth configuration
 * @see https://www.better-auth.com/docs/integrations/next-js
 */

import { auth } from '@/lib/auth/auth-server';
import { toNextJsHandler } from 'better-auth/next-js';

export const { GET, POST } = toNextJsHandler(auth);
