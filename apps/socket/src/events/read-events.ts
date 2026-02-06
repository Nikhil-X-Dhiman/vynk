/**
 * Read Receipt Event Handlers
 *
 * Handles message read receipts:
 * - MESSAGE_READ: User marks message as read
 */

import { Socket } from 'socket.io';
import { markAsRead } from '@repo/db';
import { chatNamespace } from '../server';
import { RoomService } from '../services/room-service';
import { logger } from '../utils';
import { SOCKET_EVENTS } from '@repo/shared';
import type { MessageReadPayload, SocketCallback } from '@repo/shared';

export function registerReadEvents(socket: Socket): void {
  const userId = socket.data.user.id;

  // ---------------------------------------------------------------------------
  // MESSAGE_READ - Mark message as read
  // ---------------------------------------------------------------------------
  socket.on(
    SOCKET_EVENTS.MESSAGE_READ,
    async (
      payload: MessageReadPayload,
      callback?: (res: SocketCallback) => void,
    ) => {
      try {
        const { conversationId, messageId, senderId, type } = payload;

        if (!conversationId || !messageId) {
          callback?.({
            success: false,
            error: 'conversationId and messageId are required',
          });
          return;
        }

        // Update database
        const result = await markAsRead({
          conversationId,
          userId,
          lastReadMessageId: messageId,
        });

        if (!result.success) {
          callback?.({
            success: false,
            error: result.error || 'Failed to mark as read',
          });
          return;
        }

        // Determine target room and broadcast
        let targetRoom = '';
        if (type === 'group') {
          targetRoom = `group:${conversationId}`;
        } else if (senderId) {
          targetRoom = RoomService.getPrivateRoomId(userId, senderId);
        }

        if (targetRoom) {
          chatNamespace.to(targetRoom).emit(SOCKET_EVENTS.USER_SEEN, {
            conversationId,
            userId,
            messageId,
          });
        }

        callback?.({ success: true });
        logger.debug('Message marked as read', {
          userId,
          conversationId,
          messageId,
        });
      } catch (error) {
        logger.error('Error in MESSAGE_READ', {
          userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        callback?.({ success: false, error: 'Internal server error' });
      }
    },
  );
}
