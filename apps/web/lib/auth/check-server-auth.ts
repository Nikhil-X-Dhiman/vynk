/**
 * @fileoverview Server-Side Authentication Check
 *
 * Provides a utility function for checking authentication status
 * in server components and server actions. Uses Next.js headers()
 * to access the request context.
 *
 * @module lib/auth/check-server-auth
 *
 * @example
 * ```tsx
 * // In a server component
 * import { checkServerAuth } from '@/lib/auth/check-server-auth';
 *
 * export default async function ProtectedPage() {
 *   const { isAuth, session } = await checkServerAuth();
 *
 *   if (!isAuth) {
 *     redirect('/login');
 *   }
 *
 *   return <div>Welcome, {session.user.name}!</div>;
 * }
 * ```
 *
 * @example
 * ```ts
 * // In a server action
 * 'use server';
 * import { checkServerAuth } from '@/lib/auth/check-server-auth';
 *
 * export async function updateProfile(data: FormData) {
 *   const { isAuth, session } = await checkServerAuth();
 *
 *   if (!isAuth) {
 *     throw new Error('Unauthorized');
 *   }
 *
 *   // Use session.user.id for database operations
 * }
 * ```
 */

'use server';

import { auth } from '@repo/auth';
import { headers } from 'next/headers';

// ==========================================
// Types
// ==========================================

/**
 * Session data returned from Better Auth.
 */
type AuthSession = Awaited<ReturnType<typeof auth.api.getSession>>;

/**
 * Result of the authentication check.
 */
export type CheckServerAuthResult =
  | { isAuth: true; session: NonNullable<AuthSession> }
  | { isAuth: false; session: null };

// ==========================================
// Auth Check Function
// ==========================================

/**
 * Checks the current user's authentication status on the server.
 *
 * Retrieves the session from cookies using Next.js headers.
 * Use this in server components, server actions, and API routes.
 *
 * @returns Promise resolving to auth status and session data
 *
 * @example
 * ```ts
 * const { isAuth, session } = await checkServerAuth();
 *
 * if (isAuth) {
 *   console.log('User ID:', session.user.id);
 * }
 * ```
 */
export async function checkServerAuth(): Promise<CheckServerAuthResult> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return { isAuth: false, session: null };
    }

    return { isAuth: true, session };
  } catch (error) {
    console.error('[Auth] Failed to check server auth:', error);
    return { isAuth: false, session: null };
  }
}
