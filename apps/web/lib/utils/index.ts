/**
 * @fileoverview Utility Functions Barrel Export
 *
 * Re-exports all utility functions for convenient imports.
 *
 * @module lib/utils
 *
 * @example
 * ```ts
 * import {
 *   cn,
 *   formatTimestamp,
 *   normalizeAvatarUrl,
 *   emojiFlag,
 *   idbStorage
 * } from '@/lib/utils';
 * ```
 */

// Avatar utilities
export {
  normalizeAvatarUrl,
  getAvatarFallback,
  getAvatarOrDefault,
  DEFAULT_AVATAR,
} from './avatar';

// Emoji flag utilities
export { emojiFlag, isValidCountryCode, safeEmojiFlag } from './emoji-flags';

// Environment utilities
export {
  clientEnv,
  isProduction,
  isDevelopment,
  isServer,
  isBrowser,
} from './env';
export type { ClientEnv } from './env';

// IndexedDB storage
export { idbStorage, clearPersistedStores } from './indexeddb-store';
export type { ZustandStorage } from './indexeddb-store';

// Tailwind helpers
export { cn } from './tailwind-helpers';

// Timestamp utilities
export {
  formatTimestamp,
  formatMessageTime,
  formatFullDateTime,
} from './time-stamp';
