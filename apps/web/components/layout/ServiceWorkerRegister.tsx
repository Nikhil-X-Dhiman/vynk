'use client';

import { useEffect } from 'react';
import { Workbox } from 'workbox-window';
import { db } from '@/lib/db';

export default function SWRegister() {
  useEffect(() => {
    // 1. Cleanup old stories on boot
    db.cleanupOldStories().catch(console.error);

    // 2. Register SW
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {

      const wb = new Workbox('/sw.js');

      // OPTIONAL: Logging for debugging
      wb.addEventListener('installed', (event) => {
        if (event.isUpdate) {
          console.log('New content is available! Please refresh.');
        } else {
          console.log('Service Worker installed for the first time');
        }
      });

      // Listen for messages from the SW
      wb.addEventListener('message', (event) => {
        if (event.data.type === 'OpSynced') {
          console.log('Synced operation:', event.data.action);
        }
      });

      // Register the worker
      wb.register();
    }
  }, []);

  return null;
}
