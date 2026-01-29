/// <reference lib="webworker" />

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { db } from '../lib/db';

// 1. PRECACHE ASSETS
declare const self: ServiceWorkerGlobalScope;
precacheAndRoute(self.__WB_MANIFEST || []);

// 2. CONFIGURATION & LOGGING
self.skipWaiting();
self.clients.claim();

// 3. CACHING STRATEGIES

// Images
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
);

// Scripts & Styles
registerRoute(
  ({ request }) => request.destination === 'script' || request.destination === 'style',
  new StaleWhileRevalidate({
    cacheName: 'static-resources',
  })
);

// Pages
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages',
    networkTimeoutSeconds: 3,
  })
);


// 4. BACKGROUND SYNC

interface SyncEvent extends Event {
  readonly tag: string;
  waitUntil(promise: Promise<void>): void;
}

self.addEventListener('sync', (event: Event) => {
  const syncEvent = event as SyncEvent;
  if (syncEvent.tag === 'sync-queue') {
    syncEvent.waitUntil(processQueue());
  }
});

async function processQueue() {
  const queueItems = await db.queue.orderBy('timestamp').toArray();

  for (const item of queueItems) {
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        body: JSON.stringify(item),
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        // Remove from queue on success
        await db.queue.delete(item.id!);

        // Notify Clients
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'OpSynced',
            action: item.action,
            originalId: item.id
          });
        });
      } else {
        // If server error (500), throw to let SW retry later
        if (response.status >= 500) {
          throw new Error(`Server Error ${response.status}`);
        }
        // If 400 (Bad Request), maybe delete it so we don't block the queue forever?
        // For now, logging error.
        console.error('Sync rejected:', await response.text());
        // Force delete bad items to unblock queue?
        await db.queue.delete(item.id!);
      }
    } catch (err) {
      console.error('Queue sync error:', err);
      throw err; // Trigger retry
    }
  }
}
