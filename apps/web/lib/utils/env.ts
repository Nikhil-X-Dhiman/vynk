/**
 * @fileoverview Environment Variable Utilities
 *
 * Environment validation is handled in the shared @repo/validation package.
 * This file provides client-safe environment variable access.
 *
 * @module lib/utils/env
 *
 * @see {@link @repo/validation} for server-side environment validation
 */

// ==========================================
// Client Environment
// ==========================================

/**
 * Client-safe environment variables.
 *
 * Only variables prefixed with NEXT_PUBLIC_ are available in the browser.
 * All values have fallbacks for development.
 */
export const clientEnv = {
  /** Application base URL */
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  /** WebSocket server URL */
  SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001',
  /** Cloudinary cloud name for image uploads */
  CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
} as const;

/**
 * Type for client environment variables.
 */
export type ClientEnv = typeof clientEnv;

// ==========================================
// Helpers
// ==========================================

/**
 * Checks if the app is running in production mode.
 *
 * @returns True if NODE_ENV is 'production'
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Checks if the app is running in development mode.
 *
 * @returns True if NODE_ENV is 'development'
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Checks if the code is running on the server.
 *
 * @returns True if window is undefined (server-side)
 */
export function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * Checks if the code is running in the browser.
 *
 * @returns True if window is defined (client-side)
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}
