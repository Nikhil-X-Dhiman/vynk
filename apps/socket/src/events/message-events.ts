/**
 * Message Event Handlers
 *
 * Handles all message-related socket events:
 * - MESSAGE_SEND: Send a new message
 * - MESSAGE_DELETE: Delete a message
 * - MESSAGE_REACTION: Add/remove reaction
 */

import { Socket } from 'socket.io';
import { sendMessage, deleteMessage, toggleMessageReaction } from '@repo/db';
import { chatNamespace } from '../server';
import { RoomService } from '../services/room-service';
import { logger } from '../utils';
import { SOCKET_EVENTS } from '@repo/shared';
import type {
  MessageSendPayload,
  MessageDeletePayload,
  MessageReactionPayload,
  MessageCallback,
  SocketCallback,
} from '@repo/shared';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Determines the target room based on conversation type
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

/**
 * Ensures both users are in a private room (lazy join)
 */
async function ensurePrivateRoomJoined(
  userId: string,
  receiverId: string,
  privateRoom: string,
): Promise<void> {
  await Promise.all([
    chatNamespace.in(`user:${receiverId}`).socketsJoin(privateRoom),
    chatNamespace.in(`user:${userId}`).socketsJoin(privateRoom),
  ]);
}

// =============================================================================
// Event Registration
// =============================================================================

export function registerMessageEvents(socket: Socket): void {
  const userId = socket.data.user.id;

  // ---------------------------------------------------------------------------
  // MESSAGE_SEND - Send a new message
  // ---------------------------------------------------------------------------
  socket.on(
    SOCKET_EVENTS.MESSAGE_SEND,
    async (
      payload: MessageSendPayload,
      callback?: (res: MessageCallback) => void,
    ) => {
      try {
        const {
          conversationId,
          clientMessageId,
          content,
          mediaUrl,
          mediaType,
          replyTo,
          receiverId,
          type,
        } = payload

        // Validation & for Idempotency
        if (!conversationId) {
          callback?.({ success: false, error: 'conversationId is required' })
          return
        }

        if (!content && !mediaUrl) {
          callback?.({
            success: false,
            error: 'Message must have content or media',
          })
          return
        }

        // Persist to database
        const result = await sendMessage({
          conversationId,
          senderId: userId,
          content,
          mediaUrl,
          mediaType,
          replyTo,
        })

        if (!result.success) {
          logger.warn('Message send failed', {
            userId,
            conversationId,
            error: result.error,
          })
          callback?.({
            success: false,
            error: result.error,
          })
          return
        }

        const messageId = result.data.messageId
        const messageData = {
          messageId,
          clientMessageId, // Echo back
          conversationId,
          senderId: userId,
          content,
          mediaUrl,
          mediaType,
          createdAt: new Date().toISOString(),
          replyTo,
        }

        // Self-message: sender is the only recipient — skip room emission
        const isSelfMessage = receiverId === userId || (!receiverId && !type)

        // Determine target room and emit
        if (isSelfMessage) {
          // No emission needed; the sender already has the message client-side
          logger.debug('Self-message saved (no broadcast)', {
            userId,
            conversationId,
            messageId,
          })
        } else if (type === 'group') {
          chatNamespace
            .to(`group:${conversationId}`)
            .emit(SOCKET_EVENTS.MESSAGE_NEW, messageData)
        } else if (receiverId) {
          const privateRoom = RoomService.getPrivateRoomId(userId, receiverId)
          await ensurePrivateRoomJoined(userId, receiverId, privateRoom)
          chatNamespace
            .to(privateRoom)
            .emit(SOCKET_EVENTS.MESSAGE_NEW, messageData)
        } else {
          logger.warn('Message sent without type or receiverId', {
            userId,
            conversationId,
          })
        }

        callback?.({ success: true, data: { messageId } })
        logger.debug('Message sent', { userId, conversationId, messageId })
      } catch (error) {
        logger.error('Error in MESSAGE_SEND', {
          userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        callback?.({ success: false, error: 'Internal server error' });
      }
    },
  );

  // ---------------------------------------------------------------------------
  // MESSAGE_DELETE - Delete a message
  // ---------------------------------------------------------------------------
  socket.on(
    SOCKET_EVENTS.MESSAGE_DELETE,
    async (
      payload: MessageDeletePayload,
      callback?: (res: SocketCallback) => void,
    ) => {
      try {
        const { messageId, conversationId, type, receiverId } = payload;

        if (!messageId || !conversationId) {
          callback?.({
            success: false,
            error: 'messageId and conversationId are required',
          });
          return;
        }

        // Soft delete in database
        const result = await deleteMessage(messageId);

        if (!result.success) {
          callback?.({
            success: false,
            error: result.error || 'Failed to delete message',
          });
          return;
        }

        // Broadcast deletion to room
        const deletedPayload = {
          messageId,
          conversationId,
          deletedBy: userId,
        };

        const targetRoom = getTargetRoom(
          type,
          conversationId,
          userId,
          receiverId,
        );
        if (targetRoom) {
          chatNamespace
            .to(targetRoom)
            .emit(SOCKET_EVENTS.MESSAGE_DELETED, deletedPayload);
        }

        callback?.({ success: true });
        logger.debug('Message deleted', { userId, messageId });
      } catch (error) {
        logger.error('Error in MESSAGE_DELETE', {
          userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        callback?.({ success: false, error: 'Internal server error' });
      }
    },
  );

  // ---------------------------------------------------------------------------
  // MESSAGE_REACTION - Add or remove reaction
  // ---------------------------------------------------------------------------
  socket.on(
    SOCKET_EVENTS.MESSAGE_REACTION,
    async (
      payload: MessageReactionPayload,
      callback?: (res: SocketCallback) => void,
    ) => {
      try {
        const { messageId, conversationId, emoji, type, receiverId } = payload;

        if (!messageId || !emoji) {
          callback?.({
            success: false,
            error: 'messageId and emoji are required',
          });
          return;
        }

        // Toggle reaction in database
        const result = await toggleMessageReaction({
          messageId,
          userId,
          emoji,
        });

        if (!result.success) {
          callback?.({
            success: false,
            error: result.error || 'Failed to toggle reaction',
          });
          return;
        }

        // Broadcast reaction update
        const reactionPayload = {
          messageId,
          conversationId,
          userId,
          emoji,
          action: result.data?.action || 'added',
        };

        const targetRoom = getTargetRoom(
          type,
          conversationId,
          userId,
          receiverId,
        );
        if (targetRoom) {
          chatNamespace
            .to(targetRoom)
            .emit(SOCKET_EVENTS.MESSAGE_REACTION_UPDATE, reactionPayload);
        }

        callback?.({ success: true, data: result.data });
        logger.debug('Message reaction toggled', { userId, messageId, emoji });
      } catch (error) {
        logger.error('Error in MESSAGE_REACTION', {
          userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        callback?.({ success: false, error: 'Internal server error' });
      }
    },
  );
}
