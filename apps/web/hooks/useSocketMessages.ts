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
import { db } from '@/lib/db';
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
 * - Joins the socket room on mount, leaves on unmount
 * - Deduplicates messages before writing to IndexedDB
 * - Skips subscription when offline
 *
 * @param chatId - Conversation ID to subscribe to
 * @param isOnline - Whether the browser is online
 */
export function useSocketMessages(chatId: string, isOnline: boolean): void {
  useEffect(() => {
    if (!isOnline) return

    const socket = getSocket()

    socket.emit(SOCKET_EVENTS.CONVERSATION_JOIN, { conversationId: chatId })

    // Mark conversation as read on join
    const markAsRead = async () => {
      // 1. Tell server we read it (bulk)
      emitConversationRead(chatId)

      // 2. Update local DB (mark all unread from others as seen)
      const { user } = useAuthStore.getState()
      if (!user) return

      const unreadMessages = await db.messages
        .where('conversationId')
        .equals(chatId)
        .filter((m) => m.status !== 'seen' && m.senderId !== user.id)
        .toArray()

      if (unreadMessages.length > 0) {
        await db.messages.bulkUpdate(
          unreadMessages.map((m) => ({
            key: m.id!,
            changes: { status: 'seen' },
          })),
        )
      }
    }

    markAsRead().catch(console.error)

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

    socket.on(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage)

    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage)
      socket.emit(SOCKET_EVENTS.CONVERSATION_LEAVE, {
        conversationId: chatId,
      })
    }
  }, [chatId, isOnline]);
}
