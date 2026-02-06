/**
 * Presence Event Handlers
 *
 * Handles user online/offline status:
 * - Sets user online on connection
 * - Sets user offline on disconnect
 * - Provides on-demand status check
 */

import { Socket } from 'socket.io';
import {
  setUserOnline,
  setUserOffline,
  getUserPresence,
  getFriends,
} from '@repo/db';
import { chatNamespace } from '../server';
import { logger } from '../utils';
import { SOCKET_EVENTS } from '@repo/shared';
import type {
  GetUserStatusPayload,
  UserStatusPayload,
  SocketCallback,
} from '@repo/shared';

export function registerPresenceEvents(socket: Socket): void {
  const userId = socket.data.user.id;

  // ---------------------------------------------------------------------------
  // Set Online on Connection
  // ---------------------------------------------------------------------------
  setUserOnline(userId)
    .then(() => {
      logger.debug('User marked online', { userId });

      // Notify friends that user is online
      getFriends(userId).then((result) => {
        if (result.success && result.data) {
          const onlinePayload = { userId, isOnline: true };
          result.data.forEach((friend) => {
            chatNamespace
              .to(`user:${friend.id}`)
              .emit(SOCKET_EVENTS.USER_ONLINE, onlinePayload);
          });
        }
      });
    })
    .catch((err) => {
      logger.error('Error setting user online', { userId, error: err.message });
    });

  // ---------------------------------------------------------------------------
  // GET_USER_STATUS - On-demand presence check
  // ---------------------------------------------------------------------------
  socket.on(
    SOCKET_EVENTS.GET_USER_STATUS,
    async (
      payload: GetUserStatusPayload,
      callback?: (res: UserStatusPayload | { error: string }) => void,
    ) => {
      try {
        const { userId: targetId } = payload;

        if (!targetId) {
          callback?.({ error: 'userId is required' });
          return;
        }

        const statusData = await getUserPresence(targetId);

        callback?.({
          userId: targetId,
          isOnline: statusData?.status === 'online',
          lastSeen: statusData?.lastSeen
            ? new Date(statusData.lastSeen).toISOString()
            : undefined,
        });
      } catch (error) {
        logger.error('Error in GET_USER_STATUS', {
          userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        callback?.({ error: 'Failed to fetch status' });
      }
    },
  );

  // ---------------------------------------------------------------------------
  // Set Offline on Disconnect
  // ---------------------------------------------------------------------------
  socket.on('disconnect', () => {
    setUserOffline(userId)
      .then(() => {
        logger.debug('User marked offline', { userId });

        // Notify friends that user is offline
        getFriends(userId).then((result) => {
          if (result.success && result.data) {
            const offlinePayload = {
              userId,
              isOnline: false,
              lastSeen: new Date().toISOString(),
            };
            result.data.forEach((friend) => {
              chatNamespace
                .to(`user:${friend.id}`)
                .emit(SOCKET_EVENTS.USER_OFFLINE, offlinePayload);
            });
          }
        });
      })
      .catch((err) => {
        logger.error('Error setting user offline', {
          userId,
          error: err.message,
        });
      });
  });
}
