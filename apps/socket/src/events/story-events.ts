/**
 * Story Event Handlers
 *
 * Handles all story-related socket events:
 * - STORY_PUBLISH: Create a new story
 * - STORY_VIEW: View a story
 * - STORY_DELETE: Delete a story
 * - STORY_REACTION: React to a story
 */

import { Socket } from 'socket.io';
import {
  createStory,
  deleteStory,
  recordStoryView,
  toggleStoryReaction,
  getFriends,
} from '@repo/db';
import { chatNamespace } from '../server';
import { logger } from '../utils';
import { SOCKET_EVENTS } from '@repo/shared';
import type {
  StoryPublishPayload,
  StoryViewPayload,
  StoryDeletePayload,
  StoryReactionPayload,
  StoryCallback,
  SocketCallback,
} from '@repo/shared';

export function registerStoryEvents(socket: Socket): void {
  const userId = socket.data.user.id;

  // ---------------------------------------------------------------------------
  // STORY_PUBLISH - Create a new story
  // ---------------------------------------------------------------------------
  socket.on(
    SOCKET_EVENTS.STORY_PUBLISH,
    async (
      payload: StoryPublishPayload,
      callback?: (res: StoryCallback) => void,
    ) => {
      try {
        const { mediaUrl, type, caption, text, expiresAt } = payload;

        // Validation
        if (!type) {
          callback?.({ success: false, error: 'type is required' });
          return;
        }

        if (type !== 'text' && !mediaUrl) {
          callback?.({
            success: false,
            error: 'mediaUrl is required for non-text stories',
          });
          return;
        }

        // Create story in database
        const result = await createStory({
          userId,
          contentUrl: mediaUrl,
          type,
          caption,
          text,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        });

        if (!result.success) {
          logger.warn('Story creation failed', { userId, error: result.error });
          callback?.({
            success: false,
            error: result.error || 'Failed to create story',
          });
          return;
        }

        const storyId = result.data.storyId;
        const storyPayload = {
          storyId,
          userId,
          contentUrl: mediaUrl,
          type,
          caption,
          text,
          createdAt: new Date().toISOString(),
          expiresAt,
        };

        // Broadcast to user's friends
        const friendsResult = await getFriends(userId);
        if (friendsResult.success && friendsResult.data) {
          friendsResult.data.forEach((friend) => {
            chatNamespace
              .to(`user:${friend.id}`)
              .emit(SOCKET_EVENTS.STORY_NEW, storyPayload);
          });
        }

        // Also emit to self for confirmation
        socket.emit(SOCKET_EVENTS.STORY_NEW, storyPayload);

        callback?.({ success: true, data: { storyId } });
        logger.debug('Story published', { userId, storyId });
      } catch (error) {
        logger.error('Error in STORY_PUBLISH', {
          userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        callback?.({ success: false, error: 'Internal server error' });
      }
    },
  );

  // ---------------------------------------------------------------------------
  // STORY_VIEW - Record a story view
  // ---------------------------------------------------------------------------
  socket.on(
    SOCKET_EVENTS.STORY_VIEW,
    async (
      payload: StoryViewPayload,
      callback?: (res: SocketCallback) => void,
    ) => {
      try {
        const { storyId, ownerId } = payload;

        if (!storyId || !ownerId) {
          callback?.({
            success: false,
            error: 'storyId and ownerId are required',
          });
          return;
        }

        // Don't record self-views
        if (ownerId === userId) {
          callback?.({ success: true });
          return;
        }

        // Record view in database
        const result = await recordStoryView({
          storyId,
          userId,
        });

        if (!result.success) {
          callback?.({
            success: false,
            error: result.error || 'Failed to record view',
          });
          return;
        }

        // Notify story owner
        chatNamespace.to(`user:${ownerId}`).emit(SOCKET_EVENTS.STORY_VIEWED, {
          storyId,
          viewerId: userId,
          viewedAt: new Date().toISOString(),
        });

        callback?.({ success: true });
        logger.debug('Story viewed', { viewerId: userId, storyId, ownerId });
      } catch (error) {
        logger.error('Error in STORY_VIEW', {
          userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        callback?.({ success: false, error: 'Internal server error' });
      }
    },
  );

  // ---------------------------------------------------------------------------
  // STORY_DELETE - Delete a story
  // ---------------------------------------------------------------------------
  socket.on(
    SOCKET_EVENTS.STORY_DELETE,
    async (
      payload: StoryDeletePayload,
      callback?: (res: SocketCallback) => void,
    ) => {
      try {
        const { storyId } = payload;

        if (!storyId) {
          callback?.({ success: false, error: 'storyId is required' });
          return;
        }

        // Delete from database
        const result = await deleteStory(storyId, userId);

        if (!result.success) {
          callback?.({
            success: false,
            error: result.error || 'Failed to delete story',
          });
          return;
        }

        // Broadcast deletion to friends
        const friendsResult = await getFriends(userId);
        if (friendsResult.success && friendsResult.data) {
          const deletedPayload = { storyId, userId };
          friendsResult.data.forEach((friend) => {
            chatNamespace
              .to(`user:${friend.id}`)
              .emit(SOCKET_EVENTS.STORY_DELETED, deletedPayload);
          });
        }

        callback?.({ success: true });
        logger.debug('Story deleted', { userId, storyId });
      } catch (error) {
        logger.error('Error in STORY_DELETE', {
          userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        callback?.({ success: false, error: 'Internal server error' });
      }
    },
  );

  // ---------------------------------------------------------------------------
  // STORY_REACTION - React to a story
  // ---------------------------------------------------------------------------
  socket.on(
    SOCKET_EVENTS.STORY_REACTION,
    async (
      payload: StoryReactionPayload,
      callback?: (res: SocketCallback) => void,
    ) => {
      try {
        const { storyId, ownerId, emoji } = payload;

        if (!storyId || !emoji) {
          callback?.({
            success: false,
            error: 'storyId and emoji are required',
          });
          return;
        }

        // Toggle reaction in database
        const result = await toggleStoryReaction({
          storyId,
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

        // Notify story owner
        if (ownerId && ownerId !== userId) {
          chatNamespace
            .to(`user:${ownerId}`)
            .emit(SOCKET_EVENTS.STORY_REACTION_UPDATE, {
              storyId,
              userId,
              emoji,
              action: result.data?.action || 'added',
            });
        }

        callback?.({ success: true, data: result.data });
        logger.debug('Story reaction toggled', { userId, storyId, emoji });
      } catch (error) {
        logger.error('Error in STORY_REACTION', {
          userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        callback?.({ success: false, error: 'Internal server error' });
      }
    },
  );
}
