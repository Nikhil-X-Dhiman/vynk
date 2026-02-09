/**
 * @fileoverview Avatar URL Utilities
 *
 * Provides functions for normalizing and handling avatar URLs
 * to ensure consistent URL formats across the application.
 *
 * @module lib/utils/avatar
 *
 * @example
 * ```ts
 * import { normalizeAvatarUrl, getAvatarFallback } from '@/lib/utils/avatar';
 *
 * const url = normalizeAvatarUrl('assets/avatar/1.png');
 * // Returns: '/assets/avatar/1.png'
 *
 * const fallback = getAvatarFallback('John Doe');
 * // Returns: 'JD'
 * ```
 */

// ==========================================
// Constants
// ==========================================

/**
 * Default avatar path for users without a custom avatar.
 */
export const DEFAULT_AVATAR = '/assets/avatar/default.png';

/**
 * Supported avatar URL prefixes.
 */
const ABSOLUTE_PREFIXES = ['http://', 'https://', '/', 'data:'] as const;

// ==========================================
// URL Normalization
// ==========================================

/**
 * Normalizes avatar URLs to ensure they use absolute paths.
 *
 * Handles various URL formats:
 * - Absolute URLs (http/https): returned as-is
 * - Root-relative paths (/path): returned as-is
 * - Data URLs (data:image): returned as-is
 * - Relative paths (assets/...): converted to /assets/...
 *
 * @param url - The avatar URL to normalize
 * @returns Normalized URL with leading slash, or null if input is falsy
 *
 * @example
 * ```ts
 * normalizeAvatarUrl('assets/avatar/1.png')  // '/assets/avatar/1.png'
 * normalizeAvatarUrl('https://cdn.com/img')  // 'https://cdn.com/img'
 * normalizeAvatarUrl(null)                    // null
 * ```
 */
export function normalizeAvatarUrl(
  url: string | null | undefined,
): string | null {
  if (!url) return null;

  // Check if already an absolute URL
  const isAbsolute = ABSOLUTE_PREFIXES.some((prefix) => url.startsWith(prefix));
  if (isAbsolute) {
    return url;
  }

  // Convert relative paths to absolute
  return `/${url}`;
}

// ==========================================
// Fallback Generation
// ==========================================

/**
 * Generates initials from a name for use as avatar fallback.
 *
 * Takes the first letter of the first two words in the name.
 * Returns uppercase initials.
 *
 * @param name - The user's display name
 * @returns 1-2 character initials, or '?' if name is empty
 *
 * @example
 * ```ts
 * getAvatarFallback('John Doe')     // 'JD'
 * getAvatarFallback('Alice')        // 'A'
 * getAvatarFallback('')             // '?'
 * ```
 */
export function getAvatarFallback(name: string | null | undefined): string {
  if (!name?.trim()) return '?';

  const words = name.trim().split(/\s+/);
  const initials = words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');

  return initials || '?';
}

/**
 * Gets the avatar URL or returns a default.
 *
 * @param url - The avatar URL to check
 * @returns The normalized URL or the default avatar path
 */
export function getAvatarOrDefault(url: string | null | undefined): string {
  return normalizeAvatarUrl(url) || DEFAULT_AVATAR;
}
