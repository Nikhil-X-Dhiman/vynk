/**
 * @fileoverview Socket.IO Event Listeners
 *
 * Provides functions for registering socket event listeners on the client.
 * Focused on core messaging and conversation updates.
 *
 * @module lib/services/socket/listeners
 */

import { getSocket } from './client';
import { SOCKET_EVENTS } from '@repo/shared';
import { db, LocalUser } from '@/lib/db'
import { SyncService } from '@/lib/services/sync';
import { useAuthStore } from '@/store/auth'

// ==========================================
// Types
// ==========================================

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

export interface TypingPayload {
  userId: string;
  userName: string;
  conversationId: string;
  isTyping: boolean;
}

export interface UserStatusPayload {
  userId: string;
  isOnline: boolean;
  lastSeen?: string;
}

export interface ConversationUpdatePayload {
  conversationId: string;
  title?: string;
  groupImg?: string;
  lastMessage?: IncomingMessage;
}

export type MessageCallback = (message: IncomingMessage) => void

// ==========================================
// Connection Listeners
// ==========================================

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
    console.log('[Socket] Reconnected')
    SyncService.performDeltaSync().catch(console.error)
  })
}

// ==========================================
// User Sync Listeners
// ==========================================

export function registerUserSyncListeners(): void {
  const socket = getSocket();

  socket.on(SOCKET_EVENTS.USER_LIST_INITIAL, async (users: LocalUser[]) => {
    try {
      await db.users.bulkPut(users)
    } catch (error) {
      console.error('[Sync] User list sync failed:', error)
    }
  });

  socket.on(SOCKET_EVENTS.USER_NEW, async (user: LocalUser) => {
    try {
      await db.users.put(user)
    } catch (error) {
      console.error('[Sync] New user sync failed:', error)
    }
  });

  socket.on('sync:trigger', async () => {
    await SyncService.performDeltaSync()
  })
}

// ==========================================
// Message Listeners
// ==========================================

export function onMessageReceived(callback: MessageCallback): () => void {
  const socket = getSocket();

  const handler = async (message: IncomingMessage) => {
    try {
      const currentUserId = useAuthStore.getState().user?.id

      // Deduplicate or reconcile with pending messages
      const existing = await db.messages
        .where('messageId')
        .equals(message.id)
        .first()

      if (existing) {
        await db.messages.update(existing.id!, {
          status: 'delivered',
          content: message.content,
          mediaUrl: message.mediaUrl,
          timestamp: new Date(message.createdAt).getTime(),
        })
      } else {
        const pendingMatch =
          currentUserId && message.senderId === currentUserId
            ? await db.messages
                .where('conversationId')
                .equals(message.conversationId)
                .filter(
                  (m) =>
                    m.status === 'pending' && m.content === message.content,
                )
                .first()
            : null

        if (pendingMatch) {
          await db.messages.update(pendingMatch.id!, {
            messageId: message.id,
            status: 'delivered',
            timestamp: new Date(message.createdAt).getTime(),
          })
        } else {
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

      // Update conversation metadata
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
      console.error('[Socket] Message storage failed:', error)
    }
    callback(message)
  }

  socket.on(SOCKET_EVENTS.MESSAGE_NEW, handler)
  return () => socket.off(SOCKET_EVENTS.MESSAGE_NEW, handler);
}

export function onMessageDeleted(
  callback: (data: { messageId: string; conversationId: string }) => void,
): () => void {
  const socket = getSocket();
  const handler = async (data: {
    messageId: string
    conversationId: string
  }) => {
    try {
      await db.messages.where('messageId').equals(data.messageId).delete()
    } catch (error) {
      console.error('[Socket] Delete message failed:', error)
    }
    callback(data)
  }
  socket.on(SOCKET_EVENTS.MESSAGE_DELETED, handler)
  return () => socket.off(SOCKET_EVENTS.MESSAGE_DELETED, handler);
}

export function onReactionUpdate(
  callback: (data: {
    messageId: string
    reactions: Array<{ userId: string; emoji: string }>
  }) => void,
): () => void {
  const socket = getSocket()
  socket.on(SOCKET_EVENTS.MESSAGE_REACTION_UPDATE, callback)
  return () => socket.off(SOCKET_EVENTS.MESSAGE_REACTION_UPDATE, callback)
}

export function onMessageSeen(
  callback: (data: {
    messageId: string
    userId: string
    seenAt: string
  }) => void,
): () => void {
  const socket = getSocket()
  socket.on(SOCKET_EVENTS.MESSAGE_SEEN, callback)
  return () => socket.off(SOCKET_EVENTS.MESSAGE_SEEN, callback)
}

export function onMessageDelivered(
  callback: (data: {
    messageId: string
    userId: string
    deliveredAt: string
  }) => void,
): () => void {
  const socket = getSocket()
  const handler = async (data: { messageId: string }) => {
    try {
      await db.messages
        .where('messageId')
        .equals(data.messageId)
        .modify({ status: 'delivered' })
    } catch (error) {
      console.error('[Socket] Status update failed:', error)
    }
    callback(data as any)
  }
  socket.on(SOCKET_EVENTS.MESSAGE_DELIVERED, handler)
  return () => socket.off(SOCKET_EVENTS.MESSAGE_DELIVERED, handler)
}

// ==========================================
// Typing & Status Listeners
// ==========================================

export function onUserTyping(
  callback: (data: TypingPayload) => void,
): () => void {
  const socket = getSocket()
  socket.on(SOCKET_EVENTS.USER_TYPING, callback)
  return () => socket.off(SOCKET_EVENTS.USER_TYPING, callback)
}

export function onUserStatusChange(
  callback: (data: UserStatusPayload) => void,
): () => void {
  const socket = getSocket()
  const onlineHandler = (data: { userId: string }) =>
    callback({ userId: data.userId, isOnline: true })
  const offlineHandler = (data: { userId: string; lastSeen: string }) =>
    callback({ userId: data.userId, isOnline: false, lastSeen: data.lastSeen })

  socket.on(SOCKET_EVENTS.USER_ONLINE, onlineHandler)
  socket.on(SOCKET_EVENTS.USER_OFFLINE, offlineHandler)

  return () => {
    socket.off(SOCKET_EVENTS.USER_ONLINE, onlineHandler)
    socket.off(SOCKET_EVENTS.USER_OFFLINE, offlineHandler)
  }
}

// ==========================================
// Conversation Listeners
// ==========================================

export function registerConversationListeners(): void {
  const socket = getSocket()

  socket.on(SOCKET_EVENTS.CONVERSATION_UPDATED, async () => {
    await SyncService.performDeltaSync().catch(console.error)
  })

  socket.on(SOCKET_EVENTS.CONVERSATION_CREATED, async (data: any) => {
    try {
      const { conversationId } = data
      const existing = await db.conversations
        .where('conversationId')
        .equals(conversationId)
        .first()

      if (existing) {
        await db.conversations.update(existing.id!, { isVirtual: false })
      } else {
        await db.conversations.add({
          conversationId,
          title: data.groupName || '',
          type: data.isGroup ? 'group' : 'private',
          createdAt: new Date(data.createdAt).getTime(),
          updatedAt: Date.now(),
          unreadCount: 0,
          isVirtual: false,
        })

        if (data.participants?.length) {
          for (const userId of data.participants) {
            const pExists = await db.participants
              .where('conversationId')
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
      console.error('[Sync] Conversation create failed:', error)
    }
  })

  socket.on(
    SOCKET_EVENTS.CONVERSATION_LEFT,
    async (data: { conversationId: string; userId: string }) => {
      try {
        await db.participants.delete(`${data.conversationId}_${data.userId}`)
      } catch (error) {
        console.error('[Sync] Participant remove failed:', error)
      }
    },
  )
}

// ==========================================
// Registration Info
// ==========================================

export function registerAllListeners(): void {
  registerConnectionListeners();
  registerUserSyncListeners();
  registerConversationListeners()
}

export function unregisterAllListeners(): void {
  const socket = getSocket()
  socket.offAny() // Removes all listeners
}
