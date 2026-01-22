import { Socket } from 'socket.io';
import { setUserOnline, setUserOffline, getUserPresence } from '@repo/db';
import { SOCKET_EVENTS } from '@repo/shared';

function registerPresenceEvents(socket: Socket) {
  const userId = socket.data.user.id;

  // Mark new user online on redis
  setUserOnline(userId).catch((err) =>
    console.error('Error setting user online:', err)
  );

  /**
   * On-demand presence check
   * Clients request status when needed (opening chat, viewing profile)
   */
  socket.on(SOCKET_EVENTS.GET_USER_STATUS, async ({ userId: targetId }, callback) => {
    try {
      if (!targetId) return;
      const statusData = await getUserPresence(targetId);
      if (callback) {
        callback({
          userId: targetId,
          isOnline: statusData?.status === 'online',
          lastSeen: statusData?.lastSeen
        });
      }
    } catch (error) {
       console.error('Error getting user status:', error);
       if (callback) callback({ error: 'Failed to fetch status' });
    }
  });

  socket.on('disconnect', () => {
    setUserOffline(userId).catch((err) =>
      console.error('Error setting user offline:', err)
    );
  });
}

export { registerPresenceEvents };
