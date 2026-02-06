/**
 * Friendship Event Handlers
 *
 * Handles friend request and management:
 * - FRIEND_REQUEST_SEND: Send a friend request
 * - FRIEND_REQUEST_ACCEPT: Accept a friend request
 * - FRIEND_REQUEST_REJECT: Reject a friend request
 * - FRIEND_REMOVE: Remove a friend
 */

import { Socket } from 'socket.io';
import {
  sendFriendRequest,
  respondToFriendRequest,
  removeFriend,
  findUserById,
} from '@repo/db';
import { chatNamespace } from '../server';
import { logger } from '../utils';
import { SOCKET_EVENTS } from '@repo/shared';
import type {
  FriendRequestSendPayload,
  FriendRequestRespondPayload,
  FriendRemovePayload,
  FriendshipCallback,
  SocketCallback,
} from '@repo/shared';

export function registerFriendshipEvents(socket: Socket): void {
  const userId = socket.data.user.id;

  // ---------------------------------------------------------------------------
  // FRIEND_REQUEST_SEND - Send a friend request
  // ---------------------------------------------------------------------------
  socket.on(
    SOCKET_EVENTS.FRIEND_REQUEST_SEND,
    async (
      payload: FriendRequestSendPayload,
      callback?: (res: FriendshipCallback) => void,
    ) => {
      try {
        const { targetUserId } = payload;

        if (!targetUserId) {
          callback?.({ success: false, error: 'targetUserId is required' });
          return;
        }

        if (targetUserId === userId) {
          callback?.({
            success: false,
            error: 'Cannot send friend request to yourself',
          });
          return;
        }

        // Create friend request in database
        const result = await sendFriendRequest({
          userId,
          friendId: targetUserId,
        });

        if (!result.success) {
          callback?.({
            success: false,
            error: result.error || 'Failed to send friend request',
          });
          return;
        }

        // Get sender info for notification
        const senderResult = await findUserById(userId);
        if (senderResult.success && senderResult.data) {
          const sender = senderResult.data;

          // Notify target user
          chatNamespace
            .to(`user:${targetUserId}`)
            .emit(SOCKET_EVENTS.FRIEND_REQUEST_RECEIVED, {
              requestId: result.data?.requestId,
              fromUserId: userId,
              fromUserName: sender.user_name || 'Unknown',
              fromUserAvatar: sender.avatar_url,
              createdAt: new Date().toISOString(),
            });
        }

        callback?.({
          success: true,
          data: { requestId: result.data?.requestId },
        });
        logger.info('Friend request sent', { from: userId, to: targetUserId });
      } catch (error) {
        logger.error('Error in FRIEND_REQUEST_SEND', {
          userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        callback?.({ success: false, error: 'Internal server error' });
      }
    },
  );

  // ---------------------------------------------------------------------------
  // FRIEND_REQUEST_ACCEPT - Accept a friend request
  // ---------------------------------------------------------------------------
  socket.on(
    SOCKET_EVENTS.FRIEND_REQUEST_ACCEPT,
    async (
      payload: FriendRequestRespondPayload,
      callback?: (res: FriendshipCallback) => void,
    ) => {
      try {
        const { requestId, fromUserId } = payload;

        if (!requestId || !fromUserId) {
          callback?.({
            success: false,
            error: 'requestId and fromUserId are required',
          });
          return;
        }

        // Accept the request
        const result = await respondToFriendRequest({
          requestId,
          userId,
          action: 'accept',
        });

        if (!result.success) {
          callback?.({
            success: false,
            error: result.error || 'Failed to accept friend request',
          });
          return;
        }

        // Get accepter info for notification
        const accepterResult = await findUserById(userId);
        if (accepterResult.success && accepterResult.data) {
          const accepter = accepterResult.data;

          // Notify the requester
          chatNamespace
            .to(`user:${fromUserId}`)
            .emit(SOCKET_EVENTS.FRIEND_REQUEST_ACCEPTED, {
              friendshipId: requestId,
              userId,
              userName: accepter.user_name || 'Unknown',
              userAvatar: accepter.avatar_url,
            });
        }

        callback?.({ success: true, data: { friendshipId: requestId } });
        logger.info('Friend request accepted', {
          acceptedBy: userId,
          from: fromUserId,
        });
      } catch (error) {
        logger.error('Error in FRIEND_REQUEST_ACCEPT', {
          userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        callback?.({ success: false, error: 'Internal server error' });
      }
    },
  );

  // ---------------------------------------------------------------------------
  // FRIEND_REQUEST_REJECT - Reject a friend request
  // ---------------------------------------------------------------------------
  socket.on(
    SOCKET_EVENTS.FRIEND_REQUEST_REJECT,
    async (
      payload: FriendRequestRespondPayload,
      callback?: (res: SocketCallback) => void,
    ) => {
      try {
        const { requestId, fromUserId } = payload;

        if (!requestId) {
          callback?.({ success: false, error: 'requestId is required' });
          return;
        }

        // Reject the request
        const result = await respondToFriendRequest({
          requestId,
          userId,
          action: 'reject',
        });

        if (!result.success) {
          callback?.({
            success: false,
            error: result.error || 'Failed to reject friend request',
          });
          return;
        }

        // Optionally notify the requester (some apps don't do this)
        if (fromUserId) {
          chatNamespace
            .to(`user:${fromUserId}`)
            .emit(SOCKET_EVENTS.FRIEND_REQUEST_REJECTED, {
              rejectedBy: userId,
            });
        }

        callback?.({ success: true });
        logger.info('Friend request rejected', {
          rejectedBy: userId,
          from: fromUserId,
        });
      } catch (error) {
        logger.error('Error in FRIEND_REQUEST_REJECT', {
          userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        callback?.({ success: false, error: 'Internal server error' });
      }
    },
  );

  // ---------------------------------------------------------------------------
  // FRIEND_REMOVE - Remove a friend
  // ---------------------------------------------------------------------------
  socket.on(
    SOCKET_EVENTS.FRIEND_REMOVE,
    async (
      payload: FriendRemovePayload,
      callback?: (res: SocketCallback) => void,
    ) => {
      try {
        const { friendId } = payload;

        if (!friendId) {
          callback?.({ success: false, error: 'friendId is required' });
          return;
        }

        // Remove the friendship
        const result = await removeFriend(userId, friendId);

        if (!result.success) {
          callback?.({
            success: false,
            error: result.error || 'Failed to remove friend',
          });
          return;
        }

        // Notify the removed friend
        chatNamespace
          .to(`user:${friendId}`)
          .emit(SOCKET_EVENTS.FRIEND_REMOVED, {
            userId,
          });

        callback?.({ success: true });
        logger.info('Friend removed', { removedBy: userId, friendId });
      } catch (error) {
        logger.error('Error in FRIEND_REMOVE', {
          userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        callback?.({ success: false, error: 'Internal server error' });
      }
    },
  );
}
