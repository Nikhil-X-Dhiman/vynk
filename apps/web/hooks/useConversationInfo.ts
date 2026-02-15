/**
 * @fileoverview Hook to resolve conversation display info.
 *
 * Resolves:
 * - Conversation record from DB
 * - Participants
 * - Other user info (for 1:1 chats)
 * - Derived display name/avatar
 *
 * @module hooks/useConversationInfo
 */

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/core'
import { useAuthStore } from '@/store/auth';
import type { ConversationInfo } from '@/components/chat/types';

interface UseConversationInfoResult {
  conversation: Awaited<ReturnType<typeof db.conversations.get>> | undefined
  conversationInfo: ConversationInfo | null
  isLoading: boolean
  exists: boolean
}

export function useConversationInfo(chatId: string): UseConversationInfoResult {
  const { user } = useAuthStore()

  const conversation = useLiveQuery(
    () => db.conversations.where('conversationId').equals(chatId).first(),
    [chatId],
  )

  const isLoading = conversation === undefined
  const exists = !!conversation

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

  // Derive display info
  let conversationInfo: ConversationInfo | null = null

  if (conversation) {
    let name = 'Unknown'
    let avatar: string | null = null

    if (conversation.type === 'private') {
      if (otherUserId) {
        name = otherUser?.name || conversation.displayName || 'Unknown'
        avatar = otherUser?.avatar || conversation.displayAvatar || null
      } else {
        // Self chat or broken state
        name = 'You (Saved Messages)'
        avatar = conversation.displayAvatar || null
      }
    } else {
      // Group
      name = conversation.title || 'Group'
      avatar = conversation.groupImg || null
    }

    conversationInfo = {
      name,
      avatar,
      type: conversation.type,
      otherUserId,
    }
  }

  return {
    conversation,
    conversationInfo,
    isLoading,
    exists,
  }
}
