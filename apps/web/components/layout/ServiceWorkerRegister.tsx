'use client';

/**
 * @fileoverview Service Worker & App Bootstrap Component
 *
 * Orchestrates client-side initialization for the Vynk PWA:
 * - Service worker registration with full lifecycle handling
 * - Socket.IO listener registration with proper cleanup
 * - Network status monitoring (online/offline) with sync triggers
 * - App lifecycle management (visibility change, beforeunload)
 * - Expired story cleanup on boot
 *
 * @module components/layout/ServiceWorkerRegister
 */

import { useEffect, useCallback, useRef } from 'react';
import { Workbox } from 'workbox-window';
import type {
  WorkboxLifecycleEvent,
  WorkboxLifecycleWaitingEvent,
  WorkboxMessageEvent,
} from 'workbox-window/utils/WorkboxEvent';
import { db } from '@/lib/db';
import {
  registerAllListeners,
  unregisterAllListeners,
} from '@/lib/services/socket/listeners';
import { disconnectSocket } from '@/lib/services/socket/client';
import { useAuthStore } from '@/store/auth';
import { SyncService } from '@/lib/services/sync';

// ==========================================
// Constants
// ==========================================

/** Path to the compiled service worker file */
const SW_PATH = '/sw.js';

/** Log prefix for service worker events */
const LOG_SW = '[SW]';

/** Log prefix for network events */
const LOG_NET = '[Network]';

/** Log prefix for app lifecycle events */
const LOG_APP = '[App]';

// ==========================================
// Hooks
// ==========================================

/**
 * Registers and manages the service worker lifecycle.
 *
 * Handles every lifecycle event exposed by workbox-window:
 * `installing`, `installed`, `waiting`, `activating`, `activated`,
 * `controlling`, `redundant`, and `message`.
 *
 * External (cross-tab) updates are detected via the `isExternal`
 * flag on lifecycle events.
 */
function useServiceWorker(): void {
  const wbRef = useRef<Workbox | null>(null);

  // ── Lifecycle handlers ────────────────────────────────────────

  const handleInstalled = useCallback((event: WorkboxLifecycleEvent) => {
    if (event.isExternal) {
      console.log(`${LOG_SW} External: new version installed from another tab`);
      return;
    }
    if (event.isUpdate) {
      console.log(`${LOG_SW} New version installed, waiting for activation`);
    } else {
      console.log(`${LOG_SW} Installed for the first time`);
    }
  }, []);

  const handleWaiting = useCallback((event: WorkboxLifecycleWaitingEvent) => {
    if (event.isExternal) {
      console.log(`${LOG_SW} External: new version waiting in another tab`);
      return;
    }

    console.log(`${LOG_SW} New version waiting to activate`);

    // Auto-activate the waiting service worker.
    // In a production app with complex state you may prompt the user
    // first; for a messaging app an immediate skip is safest so the
    // next navigation picks up the new SW.
    event.sw?.postMessage({ type: 'SKIP_WAITING' });
  }, []);

  const handleActivated = useCallback((event: WorkboxLifecycleEvent) => {
    if (event.isExternal) {
      console.log(`${LOG_SW} External: activated from another tab — reloading`);
      window.location.reload();
      return;
    }
    if (event.isUpdate) {
      console.log(`${LOG_SW} Updated and activated — reloading`);
      window.location.reload();
    } else {
      console.log(`${LOG_SW} Activated for the first time`);
    }
  }, []);

  const handleControlling = useCallback((event: WorkboxLifecycleEvent) => {
    if (event.isExternal) {
      console.log(`${LOG_SW} External: now controlling from another tab`);
      return;
    }
    console.log(`${LOG_SW} Now controlling this page`);
  }, []);

  const handleRedundant = useCallback(() => {
    console.warn(`${LOG_SW} Became redundant — a newer SW took over`);
  }, []);

  // ── Message handler ───────────────────────────────────────────

  const handleMessage = useCallback((event: WorkboxMessageEvent) => {
    const { type, action } = event.data ?? {};

    switch (type) {
      case 'OpSynced':
        console.log(`${LOG_SW} Synced operation: ${action}`);
        break;
      case 'CACHE_UPDATED':
        console.log(`${LOG_SW} Cache updated`);
        break;
      default:
        console.log(`${LOG_SW} Message: ${type}`);
    }
  }, []);

  // ── Registration effect ───────────────────────────────────────

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const wb = new Workbox(SW_PATH);
    wbRef.current = wb;

    // Full lifecycle
    wb.addEventListener('installed', handleInstalled);
    wb.addEventListener('waiting', handleWaiting);
    wb.addEventListener('activated', handleActivated);
    wb.addEventListener('controlling', handleControlling);
    wb.addEventListener('redundant', handleRedundant);

    // Messages from SW
    wb.addEventListener('message', handleMessage);

    wb.register().catch((error: unknown) => {
      console.error(`${LOG_SW} Registration failed:`, error);
    });

    return () => {
      wbRef.current = null;
    };
  }, [
    handleInstalled,
    handleWaiting,
    handleActivated,
    handleControlling,
    handleRedundant,
    handleMessage,
  ]);
}

/**
 * Monitors browser online/offline status.
 *
 * - On `online`: triggers delta sync + flushes the offline queue
 * - On `offline`: logs state change
 */
function useNetworkStatus(): void {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    function handleOnline(): void {
      if (!isAuthenticated) return

      console.log(`${LOG_NET} Back online — triggering sync`)
      SyncService.performDeltaSync().catch(console.error)
      db.flushQueue().catch(console.error)
    }

    function handleOffline(): void {
      console.log(`${LOG_NET} Went offline — queuing future operations`)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [isAuthenticated])
}

/**
 * Registers all Socket.IO event listeners on mount and
 * unregisters them on unmount.
 */
function useSocketListeners(): void {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      registerAllListeners();
    }

    return () => {
      unregisterAllListeners();
      disconnectSocket();
    };
  }, [isAuthenticated]);
}

/**
 * Handles app lifecycle events:
 * - `visibilitychange`: triggers delta sync when the tab becomes visible
 * - `beforeunload`: flushes the IndexedDB offline queue
 */
function useAppLifecycle(): void {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    function handleVisibilityChange(): void {
      if (document.visibilityState === 'visible') {
        if (!isAuthenticated) return

        console.log(`${LOG_APP} Tab became visible — syncing`)
        SyncService.performDeltaSync().catch(console.error)
      }
    }

    function handleBeforeUnload(): void {
      // Best-effort flush; the service worker background sync will retry
      // if this doesn't complete before the page is torn down.
      db.flushQueue().catch(() => {
        /* swallow — page is unloading */
      })
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isAuthenticated])
}

/**
 * Cleans up expired stories from IndexedDB on boot.
 */
function useStoryCleanup(): void {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated) return
    db.cleanupOldStories().catch(console.error)
  }, [isAuthenticated])
}

// ==========================================
// Component
// ==========================================

/**
 * Headless component that bootstraps all client-side services.
 *
 * Mounted once in the root layout. Renders nothing — exists purely for
 * side-effects.
 *
 * Responsibilities:
 * 1. Service worker registration & update handling
 * 2. Socket.IO listener setup & teardown
 * 3. Network status monitoring with sync triggers
 * 4. Visibility & beforeunload lifecycle handling
 * 5. Expired story cleanup
 */
export default function ServiceWorkerRegister(): null {
  useServiceWorker();
  useSocketListeners();
  useNetworkStatus();
  useAppLifecycle();
  useStoryCleanup();

  return null;
}
