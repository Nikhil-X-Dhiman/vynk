/**
 * @fileoverview Better Auth Client Configuration
 *
 * Creates and exports the authentication client for use in client-side
 * components. Configured with phone number authentication plugin.
 *
 * @module lib/auth/auth-client
 *
 * @example
 * ```tsx
 * import { authClient } from '@/lib/auth/auth-client';
 *
 * // Send OTP to phone number
 * const { error } = await authClient.phoneNumber.sendOtp({
 *   phoneNumber: '+1234567890',
 * });
 *
 * // Verify OTP
 * const { data, error } = await authClient.phoneNumber.verify({
 *   phoneNumber: '+1234567890',
 *   code: '123456',
 * });
 * ```
 */

import { createAuthClient } from 'better-auth/client';
import { phoneNumberClient } from 'better-auth/client/plugins';

// ==========================================
// Configuration
// ==========================================

/**
 * Base URL for authentication API requests.
 * Falls back to localhost in development if not set.
 */
const AUTH_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ==========================================
// Auth Client
// ==========================================

/**
 * Better Auth client instance configured for phone number authentication.
 *
 * Features:
 * - Phone number OTP authentication
 * - Session management
 * - Automatic cookie handling
 *
 * @see https://www.better-auth.com/docs/client
 */
export const authClient = createAuthClient({
  baseURL: AUTH_BASE_URL,
  plugins: [phoneNumberClient()],
});

// ==========================================
// Type Exports
// ==========================================

/**
 * Re-export common types from better-auth for convenience.
 */
export type { User, Session } from 'better-auth';

/**
 * Type for the auth client instance.
 */
export type AuthClient = typeof authClient;
