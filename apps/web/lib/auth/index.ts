/**
 * @fileoverview Auth Module Barrel Export
 *
 * Re-exports all authentication utilities for convenient imports.
 *
 * @module lib/auth
 *
 * @example
 * ```ts
 * import { authClient, auth, checkServerAuth } from '@/lib/auth';
 * import type { User, Session, CheckServerAuthResult } from '@/lib/auth';
 * ```
 */

// Client-side auth
export { authClient } from './auth-client';
export type { User, Session, AuthClient } from './auth-client';

// Server-side auth
export { auth } from './auth-server';
export type { Auth } from './auth-server';

// Auth utilities
export { checkServerAuth } from './check-server-auth';
export type { CheckServerAuthResult } from './check-server-auth';
