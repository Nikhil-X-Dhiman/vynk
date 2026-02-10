/**
 * @fileoverview Network status hook.
 *
 * Tracks browser online/offline state via `navigator.onLine` and
 * window events. Used by ChatWindow (socket vs queue) and ChatList
 * (network banner).
 *
 * @module hooks/useNetworkStatus
 */

import { useState, useEffect } from 'react';

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
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return isOnline;
}
