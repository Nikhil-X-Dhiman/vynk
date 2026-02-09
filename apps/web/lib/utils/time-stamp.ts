/**
 * @fileoverview Timestamp Formatting Utilities
 *
 * Provides functions for formatting timestamps into human-readable
 * relative time strings (e.g., "Just now", "5 minutes ago").
 *
 * @module lib/utils/time-stamp
 *
 * @example
 * ```ts
 * import { formatTimestamp, formatMessageTime } from '@/lib/utils/time-stamp';
 *
 * formatTimestamp(Date.now() - 30000)  // '30 seconds ago'
 * formatTimestamp(Date.now() - 3600000) // '1 hour ago'
 * formatMessageTime(new Date())         // '2:30 PM'
 * ```
 */

// ==========================================
// Constants
// ==========================================

/** Milliseconds in a second */
const SECOND = 1000;

/** Milliseconds in a minute */
const MINUTE = 60 * SECOND;

/** Milliseconds in an hour */
const HOUR = 60 * MINUTE;

/** Milliseconds in a day */
const DAY = 24 * HOUR;

/** Milliseconds in a week */
const WEEK = 7 * DAY;

/** Milliseconds in a month (approximate) */
const MONTH = 30 * DAY;

/** Milliseconds in a year (approximate) */
const YEAR = 365 * DAY;

// ==========================================
// Relative Time Formatting
// ==========================================

/**
 * Formats a timestamp into a human-readable relative time string.
 *
 * @param timestamp - The timestamp to format (Date, string, or number)
 * @returns Human-readable relative time string
 *
 * @example
 * ```ts
 * formatTimestamp(Date.now() - 30000)      // 'Just now'
 * formatTimestamp(Date.now() - 300000)     // '5 minutes ago'
 * formatTimestamp(Date.now() - 7200000)    // '2 hours ago'
 * formatTimestamp(Date.now() - 172800000)  // '2 days ago'
 * ```
 */
export function formatTimestamp(timestamp: string | number | Date): string {
  const now = Date.now();
  const time = new Date(timestamp).getTime();
  const diff = now - time;

  // Handle future dates
  if (diff < 0) {
    return 'Just now';
  }

  // Less than a minute
  if (diff < MINUTE) {
    return 'Just now';
  }

  // Less than an hour
  if (diff < HOUR) {
    const minutes = Math.floor(diff / MINUTE);
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  }

  // Less than a day
  if (diff < DAY) {
    const hours = Math.floor(diff / HOUR);
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }

  // Less than a week
  if (diff < WEEK) {
    const days = Math.floor(diff / DAY);
    return days === 1 ? 'Yesterday' : `${days} days ago`;
  }

  // Less than a month
  if (diff < MONTH) {
    const weeks = Math.floor(diff / WEEK);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  }

  // Less than a year
  if (diff < YEAR) {
    const months = Math.floor(diff / MONTH);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  }

  // More than a year
  const years = Math.floor(diff / YEAR);
  return years === 1 ? '1 year ago' : `${years} years ago`;
}

// ==========================================
// Message Time Formatting
// ==========================================

/**
 * Formats a timestamp for display in message lists.
 *
 * Shows time for today, day name for this week, or date for older.
 *
 * @param timestamp - The timestamp to format
 * @returns Formatted time string
 *
 * @example
 * ```ts
 * formatMessageTime(new Date())              // '2:30 PM'
 * formatMessageTime(yesterdayDate)           // 'Yesterday'
 * formatMessageTime(lastWeekDate)            // 'Monday'
 * formatMessageTime(lastMonthDate)           // '1/15/2024'
 * ```
 */
export function formatMessageTime(timestamp: string | number | Date): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // Today: show time
  if (diff < DAY && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  // Yesterday
  if (diff < 2 * DAY) {
    return 'Yesterday';
  }

  // This week: show day name
  if (diff < WEEK) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }

  // Older: show date
  return date.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Formats a timestamp as a full date and time string.
 *
 * @param timestamp - The timestamp to format
 * @returns Full date and time string
 *
 * @example
 * ```ts
 * formatFullDateTime(new Date())  // 'January 15, 2024 at 2:30 PM'
 * ```
 */
export function formatFullDateTime(timestamp: string | number | Date): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
