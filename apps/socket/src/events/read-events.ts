/**
 * Read Receipt Event Handlers
 *
 * Handles message read receipts:
 * - MESSAGE_READ: User marks message as read
 */

import { Socket } from 'socket.io';
import { markAsRead, markConversationAsRead, getParticipants } from '@repo/db'
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
        const { conversationId, messageId, senderId, type } = payload

        if (!conversationId || !messageId) {
          callback?.({
            success: false,
            error: 'conversationId and messageId are required',
          })
          return
        }

        // Update database
        const result = await markAsRead({
          conversationId,
          userId,
          lastReadMessageId: messageId,
        })

        if (!result.success) {
          callback?.({
            success: false,
            error: result.error || 'Failed to mark as read',
          })
          return
        }

        // Determine target room and broadcast
        let targetRoom = 'group:' + conversationId
        if (type !== 'group' && senderId) {
          targetRoom = RoomService.getPrivateRoomId(userId, senderId)
        }

        chatNamespace.to(targetRoom).emit(SOCKET_EVENTS.MESSAGE_SEEN, {
          conversationId,
          userId,
          messageId,
        })

        callback?.({ success: true })
        logger.debug('Message marked as read', {
          userId,
          conversationId,
          messageId,
        })
      } catch (error) {
        logger.error('Error in MESSAGE_READ', {
          userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        callback?.({ success: false, error: 'Internal server error' })
      }
    },
  )

  // ---------------------------------------------------------------------------
  // CONVERSATION_READ - Mark conversation as read
  // ---------------------------------------------------------------------------
  socket.on(
    SOCKET_EVENTS.CONVERSATION_READ,
    async (
      payload: { conversationId: string },
      callback?: (res: SocketCallback) => void,
    ) => {
      try {
        const { conversationId } = payload

        if (!conversationId) {
          callback?.({
            success: false,
            error: 'conversationId is required',
          })
          return
        }

        // Update database
        const result = await markConversationAsRead(conversationId, userId)

        if (!result.success) {
          callback?.({
            success: false,
            error: result.error || 'Failed to mark conversation as read',
          })
          return
        }

        // If no messages were read (lastReadMessageId is undefined), we don't need to broadcast
        if (!result.lastReadMessageId) {
          callback?.({ success: true })
          return
        }

        // Determine broadcast targets
        // 1. Group room: Standard for all participants who already joined via `CONVERSATION_JOIN`.
        chatNamespace
          .to(`group:${conversationId}`)
          .emit(SOCKET_EVENTS.MESSAGE_SEEN, {
            conversationId,
            userId,
            messageId: result.lastReadMessageId!,
          })

        // 2. Individual user rooms: Fallback for participants in private chats or those
        // who haven't explicitly joined the group room (e.g. lazy loading).
        const participants = await getParticipants(conversationId)

        if (participants.success && participants.data) {
          const otherParticipants = participants.data.filter(
            (p: any) => p.userId !== userId,
          )

          otherParticipants.forEach((p: any) => {
            chatNamespace
              .to(`user:${p.userId}`)
              .emit(SOCKET_EVENTS.MESSAGE_SEEN, {
                conversationId,
                userId,
                messageId: result.lastReadMessageId!,
              })
          })
        }

        callback?.({ success: true })
        logger.debug('Conversation marked as read', {
          userId,
          conversationId,
          lastReadMessageId: result.lastReadMessageId,
        })
      } catch (error) {
        logger.error('Error in CONVERSATION_READ', {
          userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        callback?.({ success: false, error: 'Internal server error' })
      }
    },
  )
}
