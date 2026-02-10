/**
 * @fileoverview Hook to resolve conversation display info.
 *
 * Queries IndexedDB for the conversation, its participants, and the
 * other user (in private chats) to build a `ConversationInfo` object
 * for the chat header.
 *
 * @module hooks/useConversationInfo
 */

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useAuthStore } from '@/store/auth';
import type { ConversationInfo } from '@/components/chat/types';

interface UseConversationInfoResult {
  conversation: Awaited<ReturnType<typeof db.conversations.get>> | undefined;
  conversationInfo: ConversationInfo | null;
  isLoading: boolean;
}

/**
 * Resolves display information for a conversation.
 *
 * @param chatId - The conversation ID to resolve
 * @returns Conversation record, display info, and loading state
 */
export function useConversationInfo(
  chatId: string,
): UseConversationInfoResult {
  const { user } = useAuthStore();

  const conversation = useLiveQuery(
    () => db.conversations.where('conversationId').equals(chatId).first(),
    [chatId],
  );

  const participants =
    useLiveQuery(
      () => db.participants.where('conversationId').equals(chatId).toArray(),
      [chatId],
    ) ?? [];

  const otherUserId = participants.find((p) => p.userId !== user?.id)?.userId;

  const otherUser = useLiveQuery(
    () => (otherUserId ? db.users.get(otherUserId) : undefined),
    [otherUserId],
  );

  const conversationInfo: ConversationInfo | null = conversation
    ? {
        name:
          conversation.type === 'private'
            ? otherUser?.name || conversation.displayName || 'Unknown'
            : conversation.title || 'Group',
        avatar:
          conversation.type === 'private'
            ? otherUser?.avatar || conversation.displayAvatar || null
            : conversation.groupImg || null,
        type: conversation.type,
        otherUserId,
      }
    : null;

  return {
    conversation,
    conversationInfo,
    isLoading: !conversation,
  };
}
