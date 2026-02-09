/// <reference lib="webworker" />

/**
 * @fileoverview Service Worker for Vynk Web Application
 *
 * Implements offline-first capabilities including:
 * - Intelligent caching strategies for different resource types
 * - Background sync for queued offline operations
 * - Push notification handling
 * - Lifecycle management with immediate activation
 *
 * @module worker
 */

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import {
  NetworkFirst,
  CacheFirst,
  StaleWhileRevalidate,
  NetworkOnly,
} from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { db } from '../lib/db';

// ==========================================
// Type Definitions
// ==========================================

declare const self: ServiceWorkerGlobalScope;

/**
 * SyncManager interface for Background Sync API.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SyncManager
 */
interface SyncManager {
  register(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
}

/**
 * Extend ServiceWorkerRegistration to include sync property.
 */
declare global {
  interface ServiceWorkerRegistration {
    readonly sync?: SyncManager;
  }
}

/**
 * Extended Event interface for Background Sync API.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SyncEvent
 */
interface SyncEvent extends ExtendableEvent {
  /** Unique identifier for the sync registration */
  readonly tag: string;
}

/**
 * Extended Event interface for Push API.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/PushEvent
 */
interface PushEvent extends ExtendableEvent {
  /** Push message data */
  readonly data: PushMessageData | null;
}

/**
 * Result of processing a single sync queue item.
 */
interface BatchProcessingResult {
  /** Queue item ID */
  id: number;
  /** Processing status */
  status: 'success' | 'failed';
  /** Error message if failed */
  error?: string;
}

/**
 * Message sent to clients after successful sync operations.
 */
interface SyncNotification {
  type: 'OpSynced';
  action: string;
  originalId: number;
}

// ==========================================
// Constants
// ==========================================

/** Background sync tag for the offline queue */
const SYNC_TAG = 'sync-queue';

/** Cache configuration */
const CacheConfig = {
  /** Cache name for image assets */
  IMAGES: 'images-v1',
  /** Cache name for static resources (JS/CSS) */
  STATIC: 'static-v1',
  /** Cache name for HTML pages */
  PAGES: 'pages-v1',
  /** Maximum cached images */
  MAX_IMAGES: 60,
  /** Image cache duration in seconds (30 days) */
  IMAGE_MAX_AGE: 30 * 24 * 60 * 60,
  /** Network timeout for navigation requests in seconds */
  NAV_TIMEOUT: 3,
} as const;

// ==========================================
// Precaching
// ==========================================

/**
 * Precache assets from the build manifest.
 * The __WB_MANIFEST placeholder is replaced during build by Workbox.
 */
precacheAndRoute(self.__WB_MANIFEST || []);

// ==========================================
// Lifecycle Management
// ==========================================

/**
 * Skip waiting phase to activate new service worker immediately.
 * Ensures updates take effect without requiring all tabs to close.
 */
self.addEventListener('install', () => {
  self.skipWaiting();
});

/**
 * Claim all clients immediately upon activation.
 * Allows the service worker to control pages that were loaded before installation.
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// ==========================================
// Caching Strategies
// ==========================================

/**
 * Auth & API Mutations - NetworkOnly
 *
 * Prevents caching of:
 * - Authentication endpoints (security requirement)
 * - POST requests (mutations should always reach server)
 *
 * This ensures sensitive data is never cached and mutations
 * are not "ghost completed" from cache.
 */
registerRoute(
  ({ url, request }) =>
    url.pathname.startsWith('/api/auth') || request.method === 'POST',
  new NetworkOnly(),
);

/**
 * Images - CacheFirst
 *
 * Aggressively caches images to improve load times and reduce bandwidth.
 * Uses expiration plugin to manage cache size and freshness.
 */
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: CacheConfig.IMAGES,
    plugins: [
      new ExpirationPlugin({
        maxEntries: CacheConfig.MAX_IMAGES,
        maxAgeSeconds: CacheConfig.IMAGE_MAX_AGE,
        purgeOnQuotaError: true,
      }),
    ],
  }),
);

/**
 * Scripts & Styles - StaleWhileRevalidate
 *
 * Serves cached assets immediately for fast initial load,
 * then updates the cache in the background for next visit.
 */
registerRoute(
  ({ request }) =>
    request.destination === 'script' || request.destination === 'style',
  new StaleWhileRevalidate({
    cacheName: CacheConfig.STATIC,
  }),
);

/**
 * Navigation - NetworkFirst
 *
 * Attempts network fetch first with a timeout fallback to cache.
 * Ensures users can navigate offline if pages were previously visited.
 */
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: CacheConfig.PAGES,
    networkTimeoutSeconds: CacheConfig.NAV_TIMEOUT,
  }),
);

// ==========================================
// Background Sync
// ==========================================

/**
 * Handles background sync events triggered by the Sync API.
 *
 * When the browser regains connectivity, this processes any
 * queued offline operations that were stored in IndexedDB.
 */
self.addEventListener('sync', (event: Event) => {
  const syncEvent = event as SyncEvent;

  if (syncEvent.tag === SYNC_TAG) {
    syncEvent.waitUntil(processOfflineQueue());
  }
});

/**
 * Processes all queued offline operations.
 *
 * Fetches items from IndexedDB, sends them to the server in a batch,
 * then removes successfully processed items and notifies connected clients.
 *
 * @throws {Error} Rethrows server errors (5xx) to trigger sync retry
 */
async function processOfflineQueue(): Promise<void> {
  const queueItems = await db.queue.orderBy('timestamp').toArray();

  if (queueItems.length === 0) {
    return;
  }

  try {
    const response = await fetch('/api/sync', {
      method: 'POST',
      body: JSON.stringify(queueItems),
      headers: { 'Content-Type': 'application/json' },
    });

    // Handle server errors - rethrow to trigger retry
    if (response.status >= 500) {
      throw new Error(`Server error: ${response.status}`);
    }

    // Handle client errors - log but don't retry (structural issue)
    if (!response.ok) {
      console.error('[SW] Batch sync rejected:', await response.text());
      return;
    }

    const { results } = (await response.json()) as {
      results: BatchProcessingResult[];
    };

    await handleSyncResults(queueItems, results);
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    // Rethrow to trigger Background Sync retry
    throw error;
  }
}

/**
 * Processes sync results and updates local state.
 *
 * @param queueItems - Original queue items that were sent
 * @param results - Processing results from the server
 */
async function handleSyncResults(
  queueItems: Array<{ id?: number; action: string }>,
  results: BatchProcessingResult[],
): Promise<void> {
  if (!Array.isArray(results)) {
    return;
  }

  const successIds: number[] = [];
  const failedIds: number[] = [];

  for (const result of results) {
    if (result.status === 'success' && result.id) {
      successIds.push(result.id);
    } else if (result.status === 'failed' && result.id) {
      // Log failed items but still remove them
      // Server explicitly rejected, retrying won't help
      console.warn(`[SW] Item ${result.id} failed: ${result.error}`);
      failedIds.push(result.id);
    }
  }

  // Remove all processed items (success + failed)
  const idsToDelete = [...successIds, ...failedIds];
  if (idsToDelete.length > 0) {
    await db.queue.bulkDelete(idsToDelete);
  }

  // Notify connected clients
  await notifyClients(queueItems, successIds);
}

/**
 * Notifies all connected clients about successfully synced operations.
 *
 * @param queueItems - Original queue items
 * @param successIds - IDs of successfully processed items
 */
async function notifyClients(
  queueItems: Array<{ id?: number; action: string }>,
  successIds: number[],
): Promise<void> {
  const clients = await self.clients.matchAll({ type: 'window' });

  for (const item of queueItems) {
    if (item.id && successIds.includes(item.id)) {
      const message: SyncNotification = {
        type: 'OpSynced',
        action: item.action,
        originalId: item.id,
      };

      for (const client of clients) {
        client.postMessage(message);
      }
    }
  }
}

// ==========================================
// Push Notifications
// ==========================================

/**
 * Handles incoming push notifications.
 *
 * Parses the push payload and displays a notification to the user.
 * Falls back to a generic notification if payload parsing fails.
 */
self.addEventListener('push', (event: Event) => {
  const pushEvent = event as PushEvent;

  const defaultNotification = {
    title: 'Vynk',
    body: 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
  };

  let notificationData = defaultNotification;

  if (pushEvent.data) {
    try {
      const payload = pushEvent.data.json();
      notificationData = {
        title: payload.title || defaultNotification.title,
        body: payload.body || defaultNotification.body,
        icon: payload.icon || defaultNotification.icon,
        badge: payload.badge || defaultNotification.badge,
      };
    } catch {
      // Use default notification on parse error
    }
  }

  pushEvent.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: 'vynk-notification',
    }),
  );
});

/**
 * Handles notification click events.
 *
 * Closes the notification and focuses or opens the app window.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if ('focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open new window
        return self.clients.openWindow('/');
      }),
  );
});

// ==========================================
// Message Handling
// ==========================================

/**
 * Handles messages from the main thread.
 *
 * Supported message types:
 * - SKIP_WAITING: Immediately activate a waiting service worker
 * - TRIGGER_SYNC: Manually trigger background sync
 */
self.addEventListener('message', (event) => {
  const { type } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'TRIGGER_SYNC':
      // Manually trigger sync (useful for testing or immediate sync)
      self.registration.sync
        ?.register(SYNC_TAG)
        .catch((err: unknown) =>
          console.warn('[SW] Sync registration failed:', err),
        );
      break;

    case 'GET_VERSION':
      // Respond with service worker version for debugging
      event.ports[0]?.postMessage({ version: '1.0.0' });
      break;
  }
});
