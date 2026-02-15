/**
 * @fileoverview Hook for sending messages.
 *
 * Capabilities:
 * - Sends messages via Socket.IO
 * - Optimistic local updates for immediate feedback
 * - Enforces online-only operation (offline sending is disabled)
 *
 * @module hooks/useSendMessage
 */

import { useCallback } from 'react';
import { v7 as uuidv7 } from 'uuid';
import { db } from '@/lib/db/core'
import type { LocalMessage } from '@/lib/db/types'
import { getSocket } from '@/lib/services/socket/client';
import { SOCKET_EVENTS } from '@repo/shared';
import { useAuthStore } from '@/store/auth';

/**
 * Returns a callback to send messages.
 *
 * @param chatId - Conversation ID
 * @param isOnline - Whether the browser is online
 * @returns Async function that accepts message text
 */
export function useSendMessage(
  chatId: string,
  isOnline: boolean,
): (text: string) => Promise<void> {
  const { user } = useAuthStore();

  return useCallback(
    async (text: string) => {
      // 1. Validation: Must be logged in and Online
      if (!user) return

      if (!isOnline) {
        // Should be disabled in UI, but safe guard here
        console.warn('[useSendMessage] Cannot send while offline')
        return
      }

      const tempId = uuidv7()
      const now = Date.now()

      // Detect self-chat
      const participants = await db.participants
        .where('conversationId')
        .equals(chatId)
        .toArray()
      const isSelfChat =
        participants.length === 1 && participants[0].userId === user.id

      const newMsg: LocalMessage = {
        messageId: tempId,
        conversationId: chatId,
        senderId: user.id,
        content: text,
        status: isSelfChat ? 'delivered' : 'pending',
        timestamp: now,
      }

      try {
        // 2. Optimistic local insert
        await db.messages.add(newMsg)

        // 3. Prepare payload data
        const conv = await db.conversations
          .where('conversationId')
          .equals(chatId)
          .first()

        const conversationType = conv?.type || 'private'

        // Find receiver for private chats
        let receiverId: string | undefined
        if (conversationType === 'private') {
          const otherParticipant = participants.find(
            (p) => p.userId !== user.id,
          )
          receiverId = otherParticipant?.userId || user.id // Self-chat fallback
        }

        // 3. Emit via socket
        const socket = getSocket()
        socket.emit(
          SOCKET_EVENTS.MESSAGE_SEND,
          {
            id: tempId, // Keeping this for backward compat if used anywhere else (unlikely)
            clientMessageId: tempId, // New field for robust deduplication
            conversationId: chatId,
            content: text,
            mediaType: 'text',
            type: conversationType, // 'private' or 'group'
            receiverId,
          },
          async (ack: { success: boolean; data?: { messageId: string } }) => {
            if (ack && ack.success && ack.data?.messageId) {
              const serverMessageId = ack.data.messageId

              // Server acknowledged receipt -> status: 'sent'
              // AND we must update the messageId to match the server's ID
              // so that subsequent events (delivered/read) can find it.

              const msg = await db.messages
                .where('messageId')
                .equals(tempId)
                .first()

              if (msg) {
                // We have to delete and re-add because messageId is part of the key path or index
                // Actually in core.ts: messages: '++id, messageId, conversationId, timestamp'
                // messageId is indexed but not the primary key. Primary key is 'id'.
                // So we can just update.
                await db.messages.update(msg.id!, {
                  status: 'sent',
                  messageId: serverMessageId,
                })
              }
            }
          },
        )

        if (conv) {
          await db.conversations.update(conv.id!, {
            lastMessage: text,
            lastMessageAt: now,
            updatedAt: now,
          })
        }
      } catch (error) {
        console.error('[useSendMessage] Failed to send:', error)

        // Mark message as failed
        const failed = await db.messages
          .where('messageId')
          .equals(tempId)
          .first()

        if (failed) {
          // In a real app we might want a 'failed' status,
          // but for now 'pending' implies it hasn't settled.
          // Since we don't queue, it effectively failed.
          await db.messages.update(failed.id!, { status: 'pending' })
        }
      }
    },
    [chatId, isOnline, user],
  );
}
