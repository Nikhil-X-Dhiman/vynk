/**
 * Typing Indicator Event Handlers
 *
 * Handles typing status broadcasts:
 * - TYPING_START: User begins typing
 * - TYPING_STOP: User stops typing
 */

import { Socket } from 'socket.io';
import { setUserTyping, clearUserTyping } from '@repo/db';
import { RoomService } from '../services/room-service';
import { logger } from '../utils';
import { SOCKET_EVENTS } from '@repo/shared';
import type { TypingPayload } from '@repo/shared';

/**
 * Gets the target room for typing broadcasts
 */
function getTargetRoom(
  type: 'private' | 'group' | undefined,
  conversationId: string,
  userId: string,
  receiverId?: string,
): string | null {
  if (type === 'group') {
    return `group:${conversationId}`;
  }
  if (receiverId) {
    return RoomService.getPrivateRoomId(userId, receiverId);
  }
  return null;
}

export function registerTypingEvents(socket: Socket): void {
  const userId = socket.data.user.id;

  // ---------------------------------------------------------------------------
  // TYPING_START - User begins typing
  // ---------------------------------------------------------------------------
  socket.on(SOCKET_EVENTS.TYPING_START, async (payload: TypingPayload) => {
    try {
      const { conversationId, receiverId, type } = payload;

      if (!conversationId) {
        logger.warn('TYPING_START missing conversationId', { userId });
        return;
      }

      // Update Redis (fire & forget for performance)
      setUserTyping({ conversationId, userId }).catch((err) => {
        logger.error('Error setting typing status', {
          userId,
          error: err.message,
        });
      });

      // Broadcast to room (excluding sender)
      const targetRoom = getTargetRoom(
        type,
        conversationId,
        userId,
        receiverId,
      );
      if (targetRoom) {
        socket.to(targetRoom).emit(SOCKET_EVENTS.USER_TYPING, {
          conversationId,
          userId,
        });
      }
    } catch (error) {
      logger.error('Error in TYPING_START', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // ---------------------------------------------------------------------------
  // TYPING_STOP - User stops typing
  // ---------------------------------------------------------------------------
  socket.on(SOCKET_EVENTS.TYPING_STOP, async (payload: TypingPayload) => {
    try {
      const { conversationId, receiverId, type } = payload;

      if (!conversationId) {
        return;
      }

      // Clear Redis typing status
      clearUserTyping({ conversationId, userId }).catch((err) => {
        logger.error('Error clearing typing status', {
          userId,
          error: err.message,
        });
      });

      // Broadcast to room
      const targetRoom = getTargetRoom(
        type,
        conversationId,
        userId,
        receiverId,
      );
      if (targetRoom) {
        socket.to(targetRoom).emit(SOCKET_EVENTS.TYPING_STOP, {
          conversationId,
          userId,
        });
      }
    } catch (error) {
      logger.error('Error in TYPING_STOP', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}
