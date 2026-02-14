/**
 * @fileoverview Hook for real-time message subscription.
 *
 * Joins the conversation room via socket and listens for new messages.
 * Deduplicates incoming messages before adding to IndexedDB.
 * Only activates when the browser is online.
 *
 * @module hooks/useSocketMessages
 */

import { useEffect } from 'react';
import { getSocket } from '@/lib/services/socket/client';
import { SOCKET_EVENTS } from '@repo/shared';
import { db, enqueue } from '@/lib/db'
import { useAuthStore } from '@/store/auth'
import { emitConversationRead } from '@/lib/services/socket/emitters'

/** Shape of an incoming message from the server. */
interface IncomingSocketMessage {
  id?: string;
  messageId?: string;
  conversationId: string;
  senderId: string;
  content?: string;
  text?: string;
  timestamp?: number;
}

/**
 * Subscribes to real-time messages for a conversation.
 *
 * - Joins the conversation room on mount, leaves on unmount
 * - Deduplicates messages before writing to IndexedDB
 * - Skips subscription when offline
 *
 * @param chatId - Conversation ID to subscribe to
 * @param isOnline - Whether the browser is online
 */
export function useSocketMessages(chatId: string, isOnline: boolean): void {
  // 1. Mark conversation as read on mount (or when chat changes)
  // This runs regardless of online status to update local state immediately.
  useEffect(() => {
    const markAsRead = async () => {
      const { user } = useAuthStore.getState()
      if (!user) return

      // Find unread messages from others
      const unreadMessages = await db.messages
        .where('conversationId')
        .equals(chatId)
        .filter((m) => m.status !== 'seen' && m.senderId !== user.id)
        .toArray()

      let lastReadMessageId: string | undefined

      if (unreadMessages.length > 0) {
        // Sort by timestamp desc to find the latest one
        unreadMessages.sort((a, b) => b.timestamp - a.timestamp)
        lastReadMessageId = unreadMessages[0].messageId

        // Mark all as seen locally
        await db.messages.bulkUpdate(
          unreadMessages.map((m) => ({
            key: m.id!,
            changes: { status: 'seen' },
          })),
        )
      } else {
        // If no unread messages, find the very last message in the conversation
        // to ensure server knows we've seen up to that point.
        const lastMessage = await db.messages
          .where('conversationId')
          .equals(chatId)
          .reverse()
          .sortBy('timestamp')
          .then((msgs) => msgs[0])

        if (lastMessage) {
          lastReadMessageId = lastMessage.messageId
        }
      }

      // Sync with server
      if (isOnline) {
        emitConversationRead(chatId)
      } else {
        // Queue for background sync if offline
        // We always queue even if no unread messages were found locally,
        // because we might have just opened the chat and want to acknowledge up to the latest local message.
        // However, if we have absolutely no messages locally, sending a read receipt might be useless but harmless.
        if (lastReadMessageId) {
          await enqueue(db, 'MESSAGE_READ', {
            conversationId: chatId,
            messageId: lastReadMessageId,
          })
        } else {
          // Fallback: just send conversation ID, server might try to interpret it
          await enqueue(db, 'MESSAGE_READ', { conversationId: chatId })
        }
      }
    }

    markAsRead().catch(console.error)
  }, [chatId, isOnline])

  // 2. Socket Subscription (Online only)
  useEffect(() => {
    if (!isOnline) return

    const socket = getSocket()

    socket.emit(SOCKET_EVENTS.CONVERSATION_JOIN, { conversationId: chatId })

    const handleNewMessage = async (msg: IncomingSocketMessage) => {
      if (msg.conversationId !== chatId) return

      const resolvedId = msg.id || msg.messageId

      // Deduplicate: skip if message already exists in local DB
      if (resolvedId) {
        const existing = await db.messages
          .where('messageId')
          .equals(resolvedId)
          .first()
        if (existing) return
      }

      const localId = await db.messages.add({
        messageId: resolvedId,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        content: msg.content || msg.text || '',
        status: 'delivered',
        timestamp: msg.timestamp || Date.now(),
      })

      // If message is from someone else, we are online and looking at it -> Mark as seen
      const { user } = useAuthStore.getState()
      if (user && msg.senderId !== user.id) {
        // Emit read event
        emitConversationRead(chatId)

        // Update local status immediately
        await db.messages.update(localId, { status: 'seen' })
      }
    }

    const handleMessageDelivered = async (data: {
      messageId: string
      conversationId: string
    }) => {
      if (data.conversationId !== chatId) return

      await db.messages
        .where('messageId')
        .equals(data.messageId)
        .modify({ status: 'delivered' })
    }

    socket.on(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage)
    socket.on(SOCKET_EVENTS.MESSAGE_DELIVERED, handleMessageDelivered)

    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage)
      socket.off(SOCKET_EVENTS.MESSAGE_DELIVERED, handleMessageDelivered)
      socket.emit(SOCKET_EVENTS.CONVERSATION_LEAVE, {
        conversationId: chatId,
      })
    }
  }, [chatId, isOnline])
}
