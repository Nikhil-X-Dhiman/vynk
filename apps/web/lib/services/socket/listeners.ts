/**
 * @fileoverview Socket.IO Event Listeners
 *
 * Provides functions for registering socket event listeners on the client.
 * Focused on core messaging and conversation updates.
 *
 * @module lib/services/socket/listeners
 */

import { getSocket } from './client';
import {
  SOCKET_EVENTS,
  type TypingPayload,
  type UserStatusPayload,
} from '@repo/shared'
import { db } from '@/lib/db'
import { SyncService } from '@/lib/services/sync';
import { useAuthStore } from '@/store/auth'

// ==========================================
// Types
// ==========================================

export interface IncomingMessage {
  id: string
  clientMessageId?: string // Add this
  conversationId: string
  senderId: string
  content: string
  mediaUrl?: string
  mediaType?: 'text' | 'image' | 'video' | 'file'
  createdAt: string
  replyTo?: string
}

// ...


export function registerConnectionListeners(): void {
  const socket = getSocket()
  socket.on('connect', () => {
    console.log('[Socket] Connected')
  })
  socket.on('disconnect', () => {
    console.log('[Socket] Disconnected')
  })
}

export function registerUserSyncListeners(): void {
  // TODO: Implement global user sync listeners if needed
  // e.g. handling global online/offline status updates for the user list
}

export function registerMessageListeners(): void {
  const socket = getSocket()

  // 1. New Message
  socket.on(SOCKET_EVENTS.MESSAGE_NEW, async (message: IncomingMessage) => {
    try {
      const currentUserId = useAuthStore.getState().user?.id

      // Deduplicate or reconcile with pending messages
      // 1. Check if message already exists by SERVER ID
      let existing = await db.messages
        .where('messageId')
        .equals(message.id)
        .first()

      // 2. If not found, check if we have a pending message with matching CLIENT ID
      // (This is the robust fix for duplication)
      if (!existing && message.clientMessageId) {
        existing = await db.messages
          .where('messageId')
          .equals(message.clientMessageId)
          .first()
      }

      if (existing) {
        // We found a match (either already synced or pending). Update it.
        await db.messages.update(existing.id!, {
          messageId: message.id, // Update to server ID
          status: 'delivered',
          content: message.content, // Ensure content is synced
          mediaUrl: message.mediaUrl,
          timestamp: new Date(message.createdAt).getTime(),
        })
      } else {
        // Fallback: Content matching (legacy behavior or if clientMessageId missing)
        let pendingMatchId: number | undefined

        if (currentUserId && message.senderId === currentUserId) {
          const matchingKeys = await db.messages
            .where('conversationId')
            .equals(message.conversationId)
            .filter(
              (m) => m.status === 'pending' && m.content === message.content,
            )
            .primaryKeys()

          if (matchingKeys.length > 0) {
            // We cast to number because the 'messages' table has '++id' auto-incrementing primary key
            pendingMatchId = matchingKeys[0] as number
          }
        }

        if (pendingMatchId !== undefined) {
          await db.messages.update(pendingMatchId, {
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
            mediaUrl: message.mediaUrl || null,
            mediaType: message.mediaType || null,
            replyTo: message.replyTo || null,
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
  })

  // 2. Message Deleted
  socket.on(
    SOCKET_EVENTS.MESSAGE_DELETED,
    async (data: { messageId: string; conversationId: string }) => {
      try {
        await db.messages.where('messageId').equals(data.messageId).delete()
      } catch (error) {
        console.error('[Socket] Delete message failed:', error)
      }
    },
  )

  // 3. Message Delivered
  socket.on(
    SOCKET_EVENTS.MESSAGE_DELIVERED,
    async (data: { messageId: string }) => {
      try {
        await db.messages
          .where('messageId')
          .equals(data.messageId)
          .modify({ status: 'delivered' })
      } catch (error) {
        console.error('[Socket] Status update failed:', error)
      }
    },
  )

  // 4. Message Seen
  socket.on(
    SOCKET_EVENTS.MESSAGE_SEEN,
    async (data: {
      messageId: string
      conversationId: string
      userId: string
    }) => {
      // If the OTHER user saw it, mark our messages as seen
      const { user } = useAuthStore.getState()
      if (user && data.userId !== user.id) {
        try {
          // Find the message to get timestamp
          const message = await db.messages
            .where('messageId')
            .equals(data.messageId)
            .first()

          if (message) {
            await db.messages
              .where('conversationId')
              .equals(data.conversationId)
              .filter(
                (m) =>
                  m.timestamp <= message.timestamp &&
                  m.senderId === user.id &&
                  m.status !== 'seen',
              )
              .modify({ status: 'seen' })
          }
        } catch (error) {
          console.error('[Socket] Seen update failed:', error)
        }
      }
    },
  )

  // 5. Reaction Update
  socket.on(SOCKET_EVENTS.MESSAGE_REACTION_UPDATE, async (data: any) => {
    // TODO: Implement reaction storage if DB supports it
    console.log('[Socket] Reaction update:', data)
  })
}


// Retain listener helpers for UI-specific callbacks if needed,
// using a simplified version that DOES NOT store to DB to avoid double-writes.
export function onMessageReceived(callback: (message: IncomingMessage) => void): () => void {
  const socket = getSocket();
  const handler = (message: IncomingMessage) => callback(message)
  socket.on(SOCKET_EVENTS.MESSAGE_NEW, handler)
  return () => socket.off(SOCKET_EVENTS.MESSAGE_NEW, handler);
}

export function onMessageDeleted(
  callback: (data: { messageId: string; conversationId: string }) => void,
): () => void {
  const socket = getSocket();
  const handler = (data: { messageId: string; conversationId: string }) => {
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
  const handler = (data: { messageId: string }) => {
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
        // Resolve display info for private chats
        let displayName = data.groupName || ''
        let displayAvatar = data.groupImg || null

        if (!data.isGroup && data.participants?.length) {
          const currentUserId = useAuthStore.getState().user?.id
          if (currentUserId) {
            const otherUserId = data.participants.find(
              (id: string) => id !== currentUserId,
            )
            if (otherUserId) {
              const otherUser = await db.users.get(otherUserId)
              if (otherUser) {
                displayName = otherUser.name
                displayAvatar = otherUser.avatar
              }
            }
          }
        }

        await db.conversations.add({
          conversationId,
          title: data.groupName || '',
          type: data.isGroup ? 'group' : 'private',
          createdAt: new Date(data.createdAt).getTime(),
          updatedAt: Date.now(),
          unreadCount: 0,
          isVirtual: false,
          displayName: displayName || 'Unknown',
          displayAvatar: displayAvatar,
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
  registerMessageListeners()
}

export function unregisterAllListeners(): void {
  const socket = getSocket()
  socket.offAny() // Removes all listeners
}
