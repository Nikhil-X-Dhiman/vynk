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
import { db } from '@/lib/db/core'
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

      // Global listener handles storage.
      // We just need to mark as seen if we are looking at it.

      const { user } = useAuthStore.getState()
      if (user && msg.senderId !== user.id) {
        emitConversationRead(chatId)

        // We might need to wait for the message to be stored by the global listener before we can update it to 'seen'.
        // Or we can just try to update it.

        const existing = await db.messages
          .where('messageId')
          .equals(msg.id || msg.messageId || '')
          .first()

        if (existing && existing.id) {
          await db.messages.update(existing.id, { status: 'seen' })
        }
      }
    }

    // We can rely on global listeners for storage and status updates.
    // But we need to keep this listener to trigger 'read' receipts for the active chat.

    // However, if we rely on useLiveQuery in the UI, we don't need to manually update state here.

    // Use a lighter listener just for read receipts?
    // Actually, let's just let the global listener do the storage.
    // This hook will watch the DB (via useLiveQuery in component) and emit read receipts when new unread messages appear.

    // BUT, valid point: useLiveQuery updates the UI.
    // Does this hook need to listen to socket events at all?
    // Yes, to join/leave the room.

    socket.on(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage)
    // Delivered/Seen are handled globally in DB. UI updates via LiveQuery.
    // ensuring we don't duplicate logic.

    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage)
      socket.emit(SOCKET_EVENTS.CONVERSATION_LEAVE, {
        conversationId: chatId,
      })
    }
  }, [chatId, isOnline])
}
