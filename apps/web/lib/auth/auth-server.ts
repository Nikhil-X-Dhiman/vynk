/**
 * @fileoverview Better Auth Server Configuration
 *
 * Re-exports the centralized auth configuration from the @repo/auth package.
 * The actual auth configuration (database, plugins, session settings) is
 * defined in the shared auth package for consistency across the monorepo.
 *
 * @module lib/auth/auth-server
 *
 * @example
 * ```ts
 * import { auth } from '@/lib/auth/auth-server';
 *
 * // Get session in API route
 * const session = await auth.api.getSession({
 *   headers: request.headers,
 * });
 *
 * // Use in route handler
 * export const GET = auth.handler;
 * ```
 *
 * @see {@link @repo/auth} for the full auth configuration
 */

import { auth } from '@repo/auth';

// ==========================================
// Auth Server Export
// ==========================================

/**
 * Better Auth server instance.
 *
 * Configured with:
 * - PostgreSQL database adapter
 * - Phone number authentication plugin
 * - Session management with cookie caching
 * - Rate limiting
 * - Next.js cookie integration
 *
 * @see https://www.better-auth.com/docs/server
 */
export { auth };

/**
 * Type for the auth server instance.
 */
export type Auth = typeof auth;
