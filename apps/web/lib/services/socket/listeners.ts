import { getSocket } from './client';

import { SOCKET_EVENTS } from '@repo/shared';
import { db, LocalUser } from '@/lib/db';

export function onMessageReceived(
  callback: (msg: { id: string; text: string }) => void
) {
  const socket = getSocket();
  socket.on(SOCKET_EVENTS.MESSAGE_NEW, callback);
}

export function registerUserSyncListeners() {
  const socket = getSocket();

  socket.on(SOCKET_EVENTS.USER_LIST_INITIAL, async (users: LocalUser[]) => {
    try {
      await db.users.bulkPut(users);
      console.log(`[Sync] User list synced: ${users.length} users`);
    } catch (error) {
       console.error('[Sync] Failed to sync user list', error);
    }
  });

  socket.on(SOCKET_EVENTS.USER_NEW, async (user: LocalUser) => {
    try {
      await db.users.put(user);
      console.log(`[Sync] New user added: ${user.name}`);
    } catch (error) {
       console.error('[Sync] Failed to add new user', error);
    }
  });
}
