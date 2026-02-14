/**
 * @fileoverview Socket.IO Event Listeners
 *
 * Provides functions for registering socket event listeners on the client.
 * Handles real-time updates for messages, users, conversations, stories, etc.
 *
 * @module lib/services/socket/listeners
 *
 * @example
 * ```ts
 * import { registerAllListeners, unregisterAllListeners } from '@/lib/services/socket';
 *
 * // In app initialization
 * useEffect(() => {
 *   registerAllListeners();
 *   return () => unregisterAllListeners();
 * }, []);
 * ```
 */

import { getSocket } from './client';
import { SOCKET_EVENTS } from '@repo/shared';
import { db, LocalUser } from '@/lib/db'
import { SyncService } from '@/lib/services/sync';
import { useAuthStore } from '@/store/auth'

// ==========================================
// Types
// ==========================================

/**
 * Incoming message structure from server.
 */
export interface IncomingMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'text' | 'image' | 'video' | 'file';
  createdAt: string;
  replyTo?: string;
}

/**
 * Typing indicator payload from server.
 */
export interface TypingPayload {
  userId: string;
  userName: string;
  conversationId: string;
  isTyping: boolean;
}

/**
 * User status payload from server.
 */
export interface UserStatusPayload {
  userId: string;
  isOnline: boolean;
  lastSeen?: string;
}

/**
 * Conversation update payload from server.
 */
export interface ConversationUpdatePayload {
  conversationId: string;
  title?: string;
  groupImg?: string;
  lastMessage?: IncomingMessage;
}

/**
 * Story payload from server.
 */
export interface StoryPayload {
  id: string;
  userId: string;
  contentUrl: string;
  type: 'text' | 'image' | 'video';
  caption?: string;
  text?: string;
  expiresAt: string;
}

/**
 * Friend request payload from server.
 */
export interface FriendRequestPayload {
  id: string;
  fromUser: LocalUser;
  createdAt: string;
}

// ==========================================
// Connection Listeners
// ==========================================

/**
 * Registers connection and reconnection event handlers.
 * Triggers delta sync on reconnection to catch missed updates.
 */
export function registerConnectionListeners(): void {
  const socket = getSocket();

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket.id);
    SyncService.performDeltaSync().catch(console.error);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('reconnect', () => {
    console.log('[Socket] Reconnected');
    SyncService.performDeltaSync().catch(console.error);
  });

  socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error.message);
  });
}

// ==========================================
// User Sync Listeners
// ==========================================

/**
 * Registers listeners for user synchronization events.
 * Handles initial user list and new user broadcasts.
 */
export function registerUserSyncListeners(): void {
  const socket = getSocket();

  // Initial user list on connection
  socket.on(SOCKET_EVENTS.USER_LIST_INITIAL, async (users: LocalUser[]) => {
    try {
      await db.users.bulkPut(users);
      console.log(`[Sync] User list synced: ${users.length} users`);
    } catch (error) {
      console.error('[Sync] Failed to sync user list:', error);
    }
  });

  // New user registration broadcast
  socket.on(SOCKET_EVENTS.USER_NEW, async (user: LocalUser) => {
    try {
      await db.users.put(user);
      console.log(`[Sync] New user added: ${user.name}`);
    } catch (error) {
      console.error('[Sync] Failed to add new user:', error);
    }
  });

  // Server-triggered sync
  socket.on('sync:trigger', async () => {
    console.log('[Socket] Sync triggered by server');
    await SyncService.performDeltaSync();
  });
}

// ==========================================
// Message Listeners
// ==========================================

/**
 * Callback type for message events.
 */
export type MessageCallback = (message: IncomingMessage) => void;

/**
 * Registers a callback for new messages.
 * @param callback - Handler for incoming messages
 * @returns Cleanup function to remove listener
 */
/**
 * Registers a callback for new messages.
 * @param callback - Handler for incoming messages
 * @returns Cleanup function to remove listener
 */
export function onMessageReceived(callback: MessageCallback): () => void {
  const socket = getSocket();

  const handler = async (message: IncomingMessage) => {
    // Store message locally
    try {
      const currentUserId = useAuthStore.getState().user?.id

      // 1. Check if we already have this message (deduplication)
      const existing = await db.messages
        .where('messageId')
        .equals(message.id)
        .first()

      if (existing) {
        // Message exists - update status to delivered
        await db.messages.update(existing.id!, {
          status: 'delivered',
          content: message.content, // Ensure content is synced
          mediaUrl: message.mediaUrl,
          timestamp: new Date(message.createdAt).getTime(),
        })
      } else {
        // 2. Check if we have a pending message matching this (reconciliation)
        let pendingMatch

        if (currentUserId && message.senderId === currentUserId) {
          pendingMatch = await db.messages
            .where('conversationId')
            .equals(message.conversationId)
            .filter(
              (m) =>
                m.status === 'pending' &&
                m.content === message.content &&
                // Optional: check if timestamp is within reasonable range (e.g. 1 min)
                Math.abs(m.timestamp - new Date(message.createdAt).getTime()) <
                  60000,
            )
            .first()
        }

        if (pendingMatch) {
          // Found matching pending message - update it to be the "real" message
          await db.messages.update(pendingMatch.id!, {
            messageId: message.id, // Update to server ID
            status: 'delivered',
            timestamp: new Date(message.createdAt).getTime(),
          })
        } else {
          // 3. New message - add it
          await db.messages.add({
            messageId: message.id,
            conversationId: message.conversationId,
            senderId: message.senderId,
            content: message.content,
            mediaUrl: message.mediaUrl,
            mediaType: message.mediaType,
            replyTo: message.replyTo,
            timestamp: new Date(message.createdAt).getTime(),
            status: 'delivered',
          })
        }
      }

      // Update conversation last message
      const conv = await db.conversations
        .where('conversationId')
        .equals(message.conversationId)
        .first()

      if (conv) {
        await db.conversations.update(conv.id!, {
          lastMessage: message.content,
          lastMessageId: message.id,
          lastMessageAt: new Date(message.createdAt).getTime(),
          updatedAt: new Date(message.createdAt).getTime(),
          unreadCount:
            message.senderId !== currentUserId
              ? (conv.unreadCount || 0) + 1
              : conv.unreadCount,
        })
      }
    } catch (error) {
      console.error('[Socket] Failed to store message:', error);
    }

    callback(message);
  };

  socket.on(SOCKET_EVENTS.MESSAGE_NEW, handler);

  return () => socket.off(SOCKET_EVENTS.MESSAGE_NEW, handler);
}

/**
 * Registers a callback for message deleted events.
 * @param callback - Handler for deleted message ID
 * @returns Cleanup function
 */
export function onMessageDeleted(
  callback: (data: { messageId: string; conversationId: string }) => void,
): () => void {
  const socket = getSocket();

  const handler = async (data: {
    messageId: string;
    conversationId: string;
  }) => {
    try {
      await db.messages.where('messageId').equals(data.messageId).delete();
    } catch (error) {
      console.error('[Socket] Failed to delete message:', error);
    }
    callback(data);
  };

  socket.on(SOCKET_EVENTS.MESSAGE_DELETED, handler);

  return () => socket.off(SOCKET_EVENTS.MESSAGE_DELETED, handler);
}

/**
 * Registers a callback for message reaction updates.
 * @param callback - Handler for reaction updates
 * @returns Cleanup function
 */
export function onReactionUpdate(
  callback: (data: {
    messageId: string;
    reactions: Array<{ userId: string; emoji: string }>;
  }) => void,
): () => void {
  const socket = getSocket();
  socket.on(SOCKET_EVENTS.MESSAGE_REACTION_UPDATE, callback);
  return () => socket.off(SOCKET_EVENTS.MESSAGE_REACTION_UPDATE, callback);
}

/**
 * Registers a callback for message seen events.
 * @param callback - Handler for seen events
 * @returns Cleanup function
 */
export function onMessageSeen(
  callback: (data: {
    messageId: string;
    userId: string;
    seenAt: string;
  }) => void,
): () => void {
  const socket = getSocket();
  socket.on(SOCKET_EVENTS.MESSAGE_SEEN, callback);
  return () => socket.off(SOCKET_EVENTS.MESSAGE_SEEN, callback);
}

/**
 * Registers a callback for message delivered events.
 * @param callback - Handler for delivered events
 * @returns Cleanup function
 */
export function onMessageDelivered(
  callback: (data: {
    messageId: string;
    userId: string;
    deliveredAt: string;
  }) => void,
): () => void {
  const socket = getSocket();

  const handler = async (data: {
    messageId: string;
    userId: string;
    deliveredAt: string;
  }) => {
     try {
       // Update message status to 'delivered' locally
       await db.messages.where('messageId').equals(data.messageId).modify({ status: 'delivered' });
     } catch (error) {
       console.error('[Socket] Failed to update message delivery status:', error);
     }
     callback(data);
  };

  socket.on(SOCKET_EVENTS.MESSAGE_DELIVERED, handler);
  return () => socket.off(SOCKET_EVENTS.MESSAGE_DELIVERED, handler);
}

// ==========================================
// Typing Indicator Listeners
// ==========================================

/**
 * Registers a callback for typing indicator events.
 * @param callback - Handler for typing events
 * @returns Cleanup function
 */
export function onUserTyping(
  callback: (data: TypingPayload) => void,
): () => void {
  const socket = getSocket();
  socket.on(SOCKET_EVENTS.USER_TYPING, callback);
  return () => socket.off(SOCKET_EVENTS.USER_TYPING, callback);
}

// ==========================================
// User Status Listeners
// ==========================================

/**
 * Registers callbacks for user online/offline status changes.
 * @param callback - Handler for status changes
 * @returns Cleanup function
 */
export function onUserStatusChange(
  callback: (data: UserStatusPayload) => void,
): () => void {
  const socket = getSocket();

  const onlineHandler = (data: { userId: string }) => {
    callback({ userId: data.userId, isOnline: true });
  };

  const offlineHandler = (data: { userId: string; lastSeen: string }) => {
    callback({ userId: data.userId, isOnline: false, lastSeen: data.lastSeen });
  };

  socket.on(SOCKET_EVENTS.USER_ONLINE, onlineHandler);
  socket.on(SOCKET_EVENTS.USER_OFFLINE, offlineHandler);

  return () => {
    socket.off(SOCKET_EVENTS.USER_ONLINE, onlineHandler);
    socket.off(SOCKET_EVENTS.USER_OFFLINE, offlineHandler);
  };
}

// ==========================================
// Conversation Listeners
// ==========================================

/**
 * Registers listeners for conversation events.
 */
export function registerConversationListeners(): void {
  const socket = getSocket()

  // Conversation updated
  socket.on(
    SOCKET_EVENTS.CONVERSATION_UPDATED,
    async (data: ConversationUpdatePayload) => {
      try {
        await SyncService.performDeltaSync()
        console.log(`[Sync] Conversation ${data.conversationId} updated`)
      } catch (error) {
        console.error('[Sync] Failed to sync conversation update:', error)
      }
    },
  )

  // New conversation created (by us or by another participant)
  socket.on(
    SOCKET_EVENTS.CONVERSATION_CREATED,
    async (data: {
      conversationId: string
      isGroup: boolean
      groupName?: string
      participants: string[]
      createdAt: string
    }) => {
      try {
        const { conversationId } = data

        // Check if we already have this conversation locally (we created it)
        const existing = await db.conversations
          .where('conversationId')
          .equals(conversationId)
          .first()

        if (existing) {
          // We created this — just mark as persisted
          await db.conversations.update(existing.id!, { isVirtual: false })
          console.log('[Sync] Conversation persisted:', conversationId)
        } else {
          // Someone else created it — add locally
          await db.conversations.add({
            conversationId,
            title: data.groupName || '',
            type: data.isGroup ? 'group' : 'private',
            createdAt: new Date(data.createdAt).getTime(),
            updatedAt: Date.now(),
            unreadCount: 0,
            isVirtual: false,
          })
          console.log('[Sync] New conversation added:', conversationId)

          // IMPORTANT: Add participants correctly
          if (data.participants && data.participants.length > 0) {
            for (const userId of data.participants) {
              // Avoid duplicates
              const pExists = await db.participants
                .where('conversationId') // Query by conversationId first (indexed)
                .equals(conversationId)
                .filter((p) => p.userId === userId)
                .first()

              if (!pExists) {
                await db.participants.add({
                  id: `${conversationId}_${userId}`,
                  conversationId,
                  userId,
                  role: 'member',
                  unreadCount: 0,
                })
              }
            }
          }
        }
      } catch (error) {
        console.error('[Sync] Failed to handle CONVERSATION_CREATED:', error)
      }
    },
  )

  // User left conversation
  socket.on(
    SOCKET_EVENTS.CONVERSATION_LEFT,
    async (data: { conversationId: string; userId: string }) => {
      try {
        await db.participants.delete(`${data.conversationId}_${data.userId}`)
        console.log('[Sync] Participant removed from conversation')
      } catch (error) {
        console.error('[Sync] Failed to remove participant:', error)
      }
    },
  )
}

// ==========================================
// Story Listeners
// ==========================================

/**
 * Registers listeners for story events.
 */
export function registerStoryListeners(): void {
  const socket = getSocket();

  // New story published
  socket.on(SOCKET_EVENTS.STORY_NEW, async (story: StoryPayload) => {
    try {
      await db.stories.add({
        storyId: story.id,
        contentUrl: story.contentUrl,
        expiresAt: new Date(story.expiresAt).getTime(),
      });
      console.log('[Sync] New story added');
    } catch (error) {
      console.error('[Sync] Failed to add story:', error);
    }
  });

  // Story deleted
  socket.on(SOCKET_EVENTS.STORY_DELETED, async (data: { storyId: string }) => {
    try {
      await db.stories.where('storyId').equals(data.storyId).delete();
      console.log('[Sync] Story deleted');
    } catch (error) {
      console.error('[Sync] Failed to delete story:', error);
    }
  });

  // Story viewed notification (for story owner)
  socket.on(
    SOCKET_EVENTS.STORY_VIEWED,
    async (data: { storyId: string; viewerId: string; viewedAt: string }) => {
      console.log(`[Sync] Story ${data.storyId} viewed by ${data.viewerId}`);
      // Could update local view count or notify UI
    },
  );
}

// ==========================================
// Friendship Listeners
// ==========================================

/**
 * Registers listeners for friendship events.
 * @param callbacks - Optional callbacks for specific events
 */
export function registerFriendshipListeners(callbacks?: {
  onRequestReceived?: (request: FriendRequestPayload) => void;
  onRequestAccepted?: (data: { userId: string }) => void;
  onRequestRejected?: (data: { userId: string }) => void;
  onFriendRemoved?: (data: { userId: string }) => void;
}): void {
  const socket = getSocket();

  socket.on(
    SOCKET_EVENTS.FRIEND_REQUEST_RECEIVED,
    (request: FriendRequestPayload) => {
      console.log(
        `[Socket] Friend request received from ${request.fromUser.name}`,
      );
      callbacks?.onRequestReceived?.(request);
    },
  );

  socket.on(
    SOCKET_EVENTS.FRIEND_REQUEST_ACCEPTED,
    (data: { userId: string }) => {
      console.log('[Socket] Friend request accepted');
      callbacks?.onRequestAccepted?.(data);
      // Trigger sync to get updated friend list
      SyncService.performDeltaSync().catch(console.error);
    },
  );

  socket.on(
    SOCKET_EVENTS.FRIEND_REQUEST_REJECTED,
    (data: { userId: string }) => {
      console.log('[Socket] Friend request rejected');
      callbacks?.onRequestRejected?.(data);
    },
  );

  socket.on(SOCKET_EVENTS.FRIEND_REMOVED, (data: { userId: string }) => {
    console.log('[Socket] Friend removed');
    callbacks?.onFriendRemoved?.(data);
    SyncService.performDeltaSync().catch(console.error);
  });
}

// ==========================================
// Register/Unregister All
// ==========================================

/**
 * Registers all socket event listeners.
 * Call once during app initialization.
 */
export function registerAllListeners(): void {
  registerConnectionListeners();
  registerUserSyncListeners();
  registerConversationListeners();
  registerStoryListeners();
}

/**
 * Unregisters all socket event listeners.
 * Call during app cleanup.
 */
export function unregisterAllListeners(): void {
  const socket = getSocket();

  // Connection events
  socket.off('connect');
  socket.off('disconnect');
  socket.off('reconnect');
  socket.off('connect_error');

  // User sync events
  socket.off(SOCKET_EVENTS.USER_LIST_INITIAL);
  socket.off(SOCKET_EVENTS.USER_NEW);
  socket.off('sync:trigger');

  // Message events
  socket.off(SOCKET_EVENTS.MESSAGE_NEW);
  socket.off(SOCKET_EVENTS.MESSAGE_DELETED);
  socket.off(SOCKET_EVENTS.MESSAGE_REACTION_UPDATE);
  socket.off(SOCKET_EVENTS.MESSAGE_SEEN);
  socket.off(SOCKET_EVENTS.MESSAGE_DELIVERED)

  // Typing events
  socket.off(SOCKET_EVENTS.USER_TYPING);

  // User status events
  socket.off(SOCKET_EVENTS.USER_ONLINE);
  socket.off(SOCKET_EVENTS.USER_OFFLINE);

  // Conversation events
  socket.off(SOCKET_EVENTS.CONVERSATION_UPDATED);
  socket.off(SOCKET_EVENTS.CONVERSATION_CREATED);
  socket.off(SOCKET_EVENTS.CONVERSATION_LEFT);

  // Story events
  socket.off(SOCKET_EVENTS.STORY_NEW);
  socket.off(SOCKET_EVENTS.STORY_DELETED);
  socket.off(SOCKET_EVENTS.STORY_VIEWED);

  // Friendship events
  socket.off(SOCKET_EVENTS.FRIEND_REQUEST_RECEIVED);
  socket.off(SOCKET_EVENTS.FRIEND_REQUEST_ACCEPTED);
  socket.off(SOCKET_EVENTS.FRIEND_REQUEST_REJECTED);
  socket.off(SOCKET_EVENTS.FRIEND_REMOVED);
}
