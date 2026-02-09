/**
 * @fileoverview IndexedDB Storage Adapter for Zustand
 *
 * Provides a storage interface compatible with Zustand's persist middleware
 * that uses IndexedDB instead of localStorage. Includes SSR safety checks.
 *
 * @module lib/utils/indexeddb-store
 *
 * @example
 * ```ts
 * import { idbStorage } from '@/lib/utils/indexeddb-store';
 * import { persist, createJSONStorage } from 'zustand/middleware';
 *
 * const useStore = create(
 *   persist(
 *     (set) => ({ ... }),
 *     {
 *       name: 'my-store',
 *       storage: createJSONStorage(() => idbStorage),
 *     }
 *   )
 * );
 * ```
 */

import { get, set, del } from 'idb-keyval';

// ==========================================
// Types
// ==========================================

/**
 * Storage interface compatible with Zustand's persist middleware.
 */
export interface ZustandStorage {
  getItem: (name: string) => Promise<string | null>;
  setItem: (name: string, value: string) => Promise<void>;
  removeItem: (name: string) => Promise<void>;
}

// ==========================================
// Storage Implementation
// ==========================================

/**
 * IndexedDB storage adapter for Zustand persist middleware.
 *
 * Features:
 * - Uses idb-keyval for simple key-value storage
 * - SSR-safe (returns null/no-ops on server)
 * - Async operations for non-blocking storage
 *
 * Benefits over localStorage:
 * - Larger storage quota (typically 50MB+)
 * - Non-blocking async operations
 * - Better performance for large data
 */
export const idbStorage: ZustandStorage = {
  /**
   * Retrieves a value from IndexedDB.
   *
   * @param name - Storage key
   * @returns The stored value or null if not found/on server
   */
  getItem: async (name: string): Promise<string | null> => {
    // SSR safety check
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const value = await get<string>(name);
      return value ?? null;
    } catch (error) {
      console.error(`[IDBStorage] Failed to get "${name}":`, error);
      return null;
    }
  },

  /**
   * Stores a value in IndexedDB.
   *
   * @param name - Storage key
   * @param value - Value to store (should be JSON string)
   */
  setItem: async (name: string, value: string): Promise<void> => {
    // SSR safety check
    if (typeof window === 'undefined') {
      return;
    }

    try {
      await set(name, value);
    } catch (error) {
      console.error(`[IDBStorage] Failed to set "${name}":`, error);
    }
  },

  /**
   * Removes a value from IndexedDB.
   *
   * @param name - Storage key to remove
   */
  removeItem: async (name: string): Promise<void> => {
    // SSR safety check
    if (typeof window === 'undefined') {
      return;
    }

    try {
      await del(name);
    } catch (error) {
      console.error(`[IDBStorage] Failed to delete "${name}":`, error);
    }
  },
};

// ==========================================
// Utility Functions
// ==========================================

/**
 * Clears all Zustand persisted stores from IndexedDB.
 *
 * @param storeNames - Array of store names to clear
 *
 * @example
 * ```ts
 * await clearPersistedStores(['auth-storage', 'login-storage']);
 * ```
 */
export async function clearPersistedStores(
  storeNames: string[],
): Promise<void> {
  await Promise.all(storeNames.map((name) => idbStorage.removeItem(name)));
}
