/// <reference lib="webworker" />

/**
 * @fileoverview Service Worker for Vynk Web Application
 *
 * Implements offline-first capabilities:
 * - Caching strategies for different resource types
 * - Push notification handling
 * - Lifecycle management
 *
 * NOTE: Background sync and offline mutation queue have been removed.
 * Offline mode is read-only.
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
import { ExpirationPlugin } from 'workbox-expiration'

// ==========================================
// Type Definitions
// ==========================================

declare const self: ServiceWorkerGlobalScope;



// ==========================================
// Constants
// ==========================================

const CacheConfig = {
  IMAGES: 'images-v1',
  STATIC: 'static-v1',
  PAGES: 'pages-v1',
  MAX_IMAGES: 60,
  IMAGE_MAX_AGE: 30 * 24 * 60 * 60, // 30 days
  NAV_TIMEOUT: 3,
} as const

// ==========================================
// Precaching
// ==========================================

precacheAndRoute(self.__WB_MANIFEST || []);

// ==========================================
// Lifecycle Management
// ==========================================

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// ==========================================
// Caching Strategies
// ==========================================

// Auth & API Mutations - NetworkOnly
// Security: Never cache auth or mutations
registerRoute(
  ({ url, request }) =>
    url.pathname.startsWith('/api/auth') || request.method === 'POST',
  new NetworkOnly(),
);

// Images - CacheFirst
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

// Scripts & Styles - StaleWhileRevalidate
registerRoute(
  ({ request }) =>
    request.destination === 'script' || request.destination === 'style',
  new StaleWhileRevalidate({
    cacheName: CacheConfig.STATIC,
  }),
);

// Navigation - NetworkFirst
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: CacheConfig.PAGES,
    networkTimeoutSeconds: CacheConfig.NAV_TIMEOUT,
  }),
);

// Push notification logic removed as per user request

// ==========================================
// Message Handling
// ==========================================

self.addEventListener('message', (event) => {
  const { type } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break

    case 'GET_VERSION':
      event.ports[0]?.postMessage({ version: '1.0.0' })
      break
  }
});
