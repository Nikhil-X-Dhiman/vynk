/**
 * @fileoverview Network status hook.
 *
 * Tracks browser online/offline state via `navigator.onLine` and
 * window events. Uses `useSyncExternalStore` for tear-free reads
 * and correct SSR hydration.
 *
 * @module hooks/useNetworkStatus
 */

import { useSyncExternalStore } from 'react'

/** Subscribe to browser online/offline events. */
function subscribe(callback: () => void): () => void {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

/** Read the current browser connectivity state. */
function getSnapshot(): boolean {
  return navigator.onLine
}

/** Server snapshot — always `true` so SSR output is hydration-safe. */
function getServerSnapshot(): boolean {
  return true
}

/**
 * Returns `true` when the browser has network connectivity.
 *
 * @example
 * ```tsx
 * const isOnline = useNetworkStatus();
 * if (!isOnline) return <OfflineBanner />;
 * ```
 */
export function useNetworkStatus(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
