'use client';

import { useEffect } from 'react';
import { Workbox } from 'workbox-window';
import { db } from '@/lib/db';
import {
  registerUserSyncListeners,
  registerConversationListeners,
} from '@/lib/services/socket/listeners';

export default function SWRegister() {
  useEffect(function setupServiceWorker() {
    // 1. Register Socket Listeners for real-time updates
    registerUserSyncListeners();
    registerConversationListeners();

    // 2. Cleanup old stories on boot
    db.cleanupOldStories().catch(console.error);

    // 3. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const wb = new Workbox('/sw.js');

      // Handle SW updates
      wb.addEventListener('installed', function handleInstalled(event) {
        if (event.isUpdate) {
          console.log('[SW] New content available! Please refresh.');
        } else {
          console.log('[SW] Service Worker installed for the first time');
        }
      });

      // Listen for messages from the SW
      wb.addEventListener('message', function handleMessage(event) {
        if (event.data.type === 'OpSynced') {
          console.log('[SW] Synced operation:', event.data.action);
        }
      });

      // Register the worker
      wb.register();
    }

    // 4. Handle online/offline events
    function handleOnline() {
      console.log('[Network] Back online, triggering sync...');
      db.sync().catch(console.error);
    }

    function handleOffline() {
      console.log('[Network] Went offline');
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return function cleanup() {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return null;
}
