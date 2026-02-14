/**
 * @fileoverview Hook for real-time message subscription.
 *
 * Capabilities:
 * - Joins conversation room via socket
 * - Listens for new messages and delivery updates
 * - Mark messages as read when viewed
 * - Offline queue logic REMOVED
 *
 * @module hooks/useSocketMessages
 */

import { useEffect } from 'react';
import { getSocket } from '@/lib/services/socket/client';
import { SOCKET_EVENTS } from '@repo/shared';
import { db } from '@/lib/db'
import { useAuthStore } from '@/store/auth'
import { emitConversationRead } from '@/lib/services/socket/emitters'

interface IncomingSocketMessage {
  id?: string;
  messageId?: string;
  conversationId: string;
  senderId: string;
  content?: string;
  text?: string;
  timestamp?: number;
}

export function useSocketMessages(chatId: string, isOnline: boolean): void {
  // 1. Mark as read logic
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

      if (unreadMessages.length > 0) {
        // Mark locally
        await db.messages.bulkUpdate(
          unreadMessages.map((m) => ({
            key: m.id!,
            changes: { status: 'seen' },
          })),
        )
      }

      // Sync with server ONLY if online
      if (isOnline) {
        emitConversationRead(chatId)
      } else {
        // Offline queue removed. We just don't emit read receipt.
        // It will be handled next time user opens chat while online,
        // or through a different sync mechanism if we implemented one (we haven't).
        // For now, read receipts are best-effort when online.
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

      // Deduplicate
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

      // Mark as seen if we are looking at it
      const { user } = useAuthStore.getState()
      if (user && msg.senderId !== user.id) {
        emitConversationRead(chatId)
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
