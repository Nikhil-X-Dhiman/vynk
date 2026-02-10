/**
 * Conversation Event Handlers
 *
 * Handles conversation management:
 * - CONVERSATION_CREATE: Create a new conversation
 * - CONVERSATION_JOIN: Join a conversation room
 * - CONVERSATION_LEAVE: Leave a conversation
 */

import { Socket } from 'socket.io';
import { createConversation, removeParticipant } from '@repo/db';
import { chatNamespace } from '../server';
import { RoomService } from '../services/room-service';
import { logger } from '../utils';
import { SOCKET_EVENTS } from '@repo/shared';
import type {
  ConversationCreatePayload,
  ConversationJoinPayload,
  ConversationLeavePayload,
  ConversationCallback,
  SocketCallback,
} from '@repo/shared';

export function registerConversationEvents(socket: Socket): void {
  const userId = socket.data.user.id;

  // ---------------------------------------------------------------------------
  // CONVERSATION_CREATE - Create a new conversation
  // ---------------------------------------------------------------------------
  socket.on(
    SOCKET_EVENTS.CONVERSATION_CREATE,
    async (
      payload: ConversationCreatePayload,
      callback?: (res: ConversationCallback) => void,
    ) => {
      try {
        const {
          conversationId: clientId,
          participantIds,
          isGroup,
          groupName,
          groupAvatar,
        } = payload

        if (!participantIds || participantIds.length === 0) {
          callback?.({ success: false, error: 'participantIds are required' })
          return
        }

        // Ensure creator is included in participants
        const allParticipants = Array.from(new Set([userId, ...participantIds]))

        // Determine conversation type
        const conversationType =
          isGroup || allParticipants.length > 2 ? 'group' : 'private'

        // Create conversation in database (use client-provided ID if available)
        const result = await createConversation({
          id: clientId,
          type: conversationType,
          title: groupName || '',
          createdByUserId: userId,
          groupImg: groupAvatar,
          participantInfo: allParticipants.map((id, index) => ({
            userId: id,
            role: id === userId ? 'admin' : 'member',
          })),
        })

        if (!result.success) {
          callback?.({ success: false, error: result.error })
          return
        }

        const conversationId = result.data
        let roomId: string

        if (conversationType === 'group') {
          roomId = `group:${conversationId}`
        } else if (allParticipants.length === 1) {
          // Self-chat: use the user's personal room
          roomId = `user:${allParticipants[0]}`
        } else {
          roomId = RoomService.getPrivateRoomId(
            allParticipants[0],
            allParticipants[1],
          )
        }

        // Join all participants to the room
        allParticipants.forEach((participantId) => {
          chatNamespace.in(`user:${participantId}`).socketsJoin(roomId)
        })

        // Notify all participants
        const createdPayload = {
          conversationId,
          isGroup: conversationType === 'group',
          groupName,
          participants: allParticipants,
          createdAt: new Date().toISOString(),
        }

        allParticipants.forEach((participantId) => {
          chatNamespace
            .to(`user:${participantId}`)
            .emit(SOCKET_EVENTS.CONVERSATION_CREATED, createdPayload)
        })

        callback?.({ success: true, data: { conversationId } })
        logger.info('Conversation created', {
          conversationId,
          createdBy: userId,
          participantCount: allParticipants.length,
        })
      } catch (error) {
        logger.error('Error in CONVERSATION_CREATE', {
          userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        callback?.({ success: false, error: 'Internal server error' });
      }
    },
  );

  // ---------------------------------------------------------------------------
  // CONVERSATION_JOIN - Join a conversation room
  // ---------------------------------------------------------------------------
  socket.on(
    SOCKET_EVENTS.CONVERSATION_JOIN,
    async (
      payload: ConversationJoinPayload,
      callback?: (res: SocketCallback) => void,
    ) => {
      try {
        const { conversationId } = payload;

        if (!conversationId) {
          callback?.({ success: false, error: 'conversationId is required' });
          return;
        }

        // Join the room (for group conversations)
        const roomId = `group:${conversationId}`;
        socket.join(roomId);

        callback?.({ success: true });
        logger.debug('User joined conversation room', {
          userId,
          conversationId,
        });
      } catch (error) {
        logger.error('Error in CONVERSATION_JOIN', {
          userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        callback?.({ success: false, error: 'Internal server error' });
      }
    },
  );

  // ---------------------------------------------------------------------------
  // CONVERSATION_LEAVE - Leave a conversation
  // ---------------------------------------------------------------------------
  socket.on(
    SOCKET_EVENTS.CONVERSATION_LEAVE,
    async (
      payload: ConversationLeavePayload,
      callback?: (res: SocketCallback) => void,
    ) => {
      try {
        const { conversationId } = payload;

        if (!conversationId) {
          callback?.({ success: false, error: 'conversationId is required' });
          return;
        }

        // Remove participant from database
        const result = await removeParticipant(conversationId, userId);

        if (!result.success) {
          callback?.({
            success: false,
            error: result.error || 'Failed to leave conversation',
          });
          return;
        }

        // Leave the room
        const roomId = `group:${conversationId}`;
        socket.leave(roomId);

        // Notify other participants
        chatNamespace.to(roomId).emit(SOCKET_EVENTS.CONVERSATION_LEFT, {
          conversationId,
          userId,
        });

        callback?.({ success: true });
        logger.info('User left conversation', { userId, conversationId });
      } catch (error) {
        logger.error('Error in CONVERSATION_LEAVE', {
          userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        callback?.({ success: false, error: 'Internal server error' });
      }
    },
  );
}
