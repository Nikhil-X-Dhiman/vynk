/**
 * @fileoverview Hook for sending messages with offline support.
 *
 * Online: emits via socket AND queues for backup sync.
 * Offline: queues to IndexedDB; the service worker flushes on reconnect.
 * Uses UUID v7 for time-ordered, DB-friendly temp IDs.
 *
 * @module hooks/useSendMessage
 */

import { useCallback } from 'react';
import { v7 as uuidv7 } from 'uuid';
import { db, LocalMessage } from '@/lib/db';
import { getSocket } from '@/lib/services/socket/client';
import { SOCKET_EVENTS } from '@repo/shared';
import { useAuthStore } from '@/store/auth';

/**
 * Returns a stable `sendMessage` callback for a conversation.
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
      if (!user) return;

      const tempId = uuidv7();
      const now = Date.now();

      const newMsg: LocalMessage = {
        messageId: tempId,
        conversationId: chatId,
        senderId: user.id,
        content: text,
        status: 'pending',
        timestamp: now,
      };

      try {
        // 1. Optimistic local insert
        await db.messages.add(newMsg);

        // 2. Emit via socket if online
        if (isOnline) {
          const socket = getSocket();
          socket.emit(SOCKET_EVENTS.MESSAGE_SEND, {
            conversationId: chatId,
            content: text,
            type: 'text',
          });
        }

        // 3. Always queue for background sync (service worker flushes when online)
        await db.enqueue('MESSAGE_SEND', {
          id: tempId,
          conversationId: chatId,
          content: text,
          mediaType: 'text',
          timestamp: now,
        });

        // 4. Update conversation's last message
        const conv = await db.conversations
          .where('conversationId')
          .equals(chatId)
          .first();

        if (conv) {
          await db.conversations.update(conv.id!, {
            lastMessage: text,
            lastMessageAt: now,
            updatedAt: now,
          });
        }
      } catch (error) {
        console.error('[useSendMessage] Failed to send:', error);

        // Mark message as failed (keep for retry, don't delete)
        const failed = await db.messages
          .where('messageId')
          .equals(tempId)
          .first();

        if (failed) {
          await db.messages.update(failed.id!, { status: 'pending' });
        }
      }
    },
    [chatId, isOnline, user],
  );
}
