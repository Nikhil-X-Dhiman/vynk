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
    if (!isOnline) return;

    const socket = getSocket();

    socket.emit(SOCKET_EVENTS.CONVERSATION_JOIN, { conversationId: chatId });

    const handleNewMessage = async (msg: IncomingSocketMessage) => {
      if (msg.conversationId !== chatId) return;

      const resolvedId = msg.id || msg.messageId;

      // Deduplicate: skip if message already exists in local DB
      if (resolvedId) {
        const existing = await db.messages
          .where('messageId')
          .equals(resolvedId)
          .first();
        if (existing) return;
      }

      await db.messages.add({
        messageId: resolvedId,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        content: msg.content || msg.text || '',
        status: 'delivered',
        timestamp: msg.timestamp || Date.now(),
      });
    };

    socket.on(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);

    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);
      socket.emit(SOCKET_EVENTS.CONVERSATION_LEAVE, {
        conversationId: chatId,
      });
    };
  }, [chatId, isOnline]);
}
