'use client';

import { useEffect } from 'react';
import { Workbox } from 'workbox-window';
import { db } from '@/lib/db';
import { registerUserSyncListeners } from '@/lib/services/socket/listeners';

export default function SWRegister() {
  useEffect(() => {
    // 0. Register Socket Listeners
    registerUserSyncListeners();

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

    // 3. Socket Event for Delta Sync
    // Assuming you have a socket instance exported or accessible
    // import { socket } from '@/lib/socket';
    // socket.on('new-updates', () => db.pullDelta().catch(console.error));

    // For now, we stub it or use window event if socket is global
    window.addEventListener('online', () => db.sync().catch(console.error));

  }, []);

  return null;
}

// TODO: Add socket event for delta sync
