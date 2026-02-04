import { Socket } from 'socket.io';
import { setUserOnline, setUserOffline, getUserPresence } from '@repo/db';
import { SOCKET_EVENTS } from '@repo/shared';

/**
 * Register presence/status event handlers.
 *
 * Handles:
 * - Sets user online on connection (Redis update)
 * - GET_USER_STATUS: On-demand presence check
 * - Sets user offline on disconnect
 *
 * Presence is stored in Redis for fast lookup without DB queries.
 *
 * @param socket - The connected socket instance with user data
 */
function registerPresenceEvents(socket: Socket) {
  const userId = socket.data.user.id;

  // Mark user as online in Redis on connection
  setUserOnline(userId).catch((err) =>
    console.error('Error setting user online:', err),
  );

  /**
   * On-demand presence check
   * Clients request status when needed (opening chat, viewing profile)
   */
  socket.on(
    SOCKET_EVENTS.GET_USER_STATUS,
    async ({ userId: targetId }, callback) => {
      try {
        if (!targetId) return;
        const statusData = await getUserPresence(targetId);
        if (callback) {
          callback({
            userId: targetId,
            isOnline: statusData?.status === 'online',
            lastSeen: statusData?.lastSeen,
          });
        }
      } catch (error) {
        console.error('Error getting user status:', error);
        if (callback) callback({ error: 'Failed to fetch status' });
      }
    },
  );

  socket.on('disconnect', () => {
    setUserOffline(userId).catch((err) =>
      console.error('Error setting user offline:', err),
    );
  });
}

export { registerPresenceEvents };
