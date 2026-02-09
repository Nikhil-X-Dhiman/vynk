/**
 * @fileoverview Emoji Flag Utilities
 *
 * Converts ISO 3166-1 alpha-2 country codes to emoji flags.
 * Uses Unicode regional indicator symbols.
 *
 * @module lib/utils/emoji-flags
 *
 * @example
 * ```ts
 * import { emojiFlag, isValidCountryCode } from '@/lib/utils/emoji-flags';
 *
 * emojiFlag('US')  // '🇺🇸'
 * emojiFlag('GB')  // '🇬🇧'
 * emojiFlag('IN')  // '🇮🇳'
 * ```
 */

// ==========================================
// Constants
// ==========================================

/**
 * Unicode offset for converting ASCII letters to regional indicator symbols.
 * 'A' (65) + 127397 = '🇦' (Regional Indicator Symbol Letter A)
 */
const REGIONAL_INDICATOR_OFFSET = 127397;

/**
 * Regex pattern for valid ISO 3166-1 alpha-2 country codes.
 */
const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;

// ==========================================
// Functions
// ==========================================

/**
 * Converts an ISO 3166-1 alpha-2 country code to its emoji flag.
 *
 * Works by converting each letter to a regional indicator symbol.
 * For example, 'U' becomes '🇺' and 'S' becomes '🇸', forming '🇺🇸'.
 *
 * @param countryCode - Two-letter ISO country code (e.g., 'US', 'GB', 'IN')
 * @returns The emoji flag string
 *
 * @example
 * ```ts
 * emojiFlag('US')  // '🇺🇸'
 * emojiFlag('us')  // '🇺🇸' (case-insensitive)
 * emojiFlag('JP')  // '🇯🇵'
 * ```
 */
export function emojiFlag(countryCode: string): string {
  return countryCode
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(char.charCodeAt(0) + REGIONAL_INDICATOR_OFFSET),
    );
}

/**
 * Validates if a string is a valid ISO 3166-1 alpha-2 country code format.
 *
 * Note: This only validates the format (2 uppercase letters),
 * not whether the code actually represents a valid country.
 *
 * @param code - The string to validate
 * @returns True if the format is valid
 *
 * @example
 * ```ts
 * isValidCountryCode('US')   // true
 * isValidCountryCode('USA')  // false (3 letters)
 * isValidCountryCode('12')   // false (not letters)
 * ```
 */
export function isValidCountryCode(code: string): boolean {
  return COUNTRY_CODE_PATTERN.test(code.toUpperCase());
}

/**
 * Safely converts a country code to emoji flag with validation.
 *
 * @param countryCode - Two-letter ISO country code
 * @returns The emoji flag or empty string if invalid
 *
 * @example
 * ```ts
 * safeEmojiFlag('US')    // '🇺🇸'
 * safeEmojiFlag('XYZ')   // '' (invalid)
 * safeEmojiFlag('')      // '' (empty)
 * ```
 */
export function safeEmojiFlag(countryCode: string | null | undefined): string {
  if (!countryCode || !isValidCountryCode(countryCode)) {
    return '';
  }
  return emojiFlag(countryCode);
}
