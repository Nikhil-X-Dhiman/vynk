/**
 * @fileoverview Tailwind CSS Utility Helpers
 *
 * Provides utility functions for working with Tailwind CSS classes,
 * including conditional class merging and conflict resolution.
 *
 * @module lib/utils/tailwind-helpers
 *
 * @example
 * ```tsx
 * import { cn } from '@/lib/utils/tailwind-helpers';
 *
 * // Merge classes conditionally
 * <div className={cn(
 *   'p-4 rounded',
 *   isActive && 'bg-blue-500',
 *   isDisabled && 'opacity-50 cursor-not-allowed'
 * )} />
 *
 * // Override conflicting classes
 * <div className={cn('p-4 p-8')} />  // Results in 'p-8'
 * ```
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ==========================================
// Class Name Utilities
// ==========================================

/**
 * Merges class names with Tailwind CSS conflict resolution.
 *
 * Combines the functionality of `clsx` (conditional classes) and
 * `tailwind-merge` (resolving Tailwind class conflicts).
 *
 * Features:
 * - Handles conditional classes (strings, objects, arrays)
 * - Resolves Tailwind conflicts (later classes win)
 * - Removes falsy values
 *
 * @param inputs - Class values to merge (strings, objects, arrays, or falsy values)
 * @returns Merged class string with conflicts resolved
 *
 * @example
 * ```tsx
 * // Basic usage
 * cn('text-red-500', 'text-blue-500')  // 'text-blue-500'
 *
 * // With conditions
 * cn('base-class', isActive && 'active-class')
 *
 * // With objects
 * cn({ 'hidden': !visible, 'block': visible })
 *
 * // Component pattern
 * function Button({ className, ...props }) {
 *   return <button className={cn('btn btn-primary', className)} {...props} />;
 * }
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
