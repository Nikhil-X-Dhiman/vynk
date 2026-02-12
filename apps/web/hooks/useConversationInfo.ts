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
  conversation: Awaited<ReturnType<typeof db.conversations.get>> | undefined
  conversationInfo: ConversationInfo | null
  isLoading: boolean
  exists: boolean
}

/**
 * Resolves display information for a conversation.
 *
 * @param chatId - The conversation ID to resolve
 * @returns Conversation record, display info, loading state, and existence flag
 */
export function useConversationInfo(chatId: string): UseConversationInfoResult {
  const { user } = useAuthStore()

  // useLiveQuery returns the default value ('loading') initially.
  // When the query completes, it returns the result (Conversation or undefined).
  const conversation = useLiveQuery(
    () => db.conversations.where('conversationId').equals(chatId).first(),
    [chatId],
    'loading' as any,
  )

  const isLoading = conversation === 'loading'
  const exists = conversation !== 'loading' && conversation !== undefined

  // Normalize conversation for downstream usage
  const conversationData = exists ? conversation : undefined

  const participants =
    useLiveQuery(
      () => db.participants.where('conversationId').equals(chatId).toArray(),
      [chatId],
    ) ?? []

  const otherUserId = participants.find((p) => p.userId !== user?.id)?.userId

  const otherUser = useLiveQuery(
    () => (otherUserId ? db.users.get(otherUserId) : undefined),
    [otherUserId],
  )

  const conversationInfo: ConversationInfo | null = conversationData
    ? {
        name:
          conversationData.type === 'private'
            ? otherUserId
              ? otherUser?.name || conversationData.displayName || 'Unknown'
              : 'You (Saved Messages)'
            : conversationData.title || 'Group',
        avatar:
          conversationData.type === 'private'
            ? otherUserId
              ? otherUser?.avatar || conversationData.displayAvatar || null
              : conversationData.displayAvatar || null
            : conversationData.groupImg || null,
        type: conversationData.type,
        otherUserId,
      }
    : null

  return {
    conversation: conversationData,
    conversationInfo,
    isLoading,
    exists,
  }
}
