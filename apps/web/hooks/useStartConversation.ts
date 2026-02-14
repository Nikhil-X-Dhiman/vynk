/**
 * @fileoverview Hook for starting a conversation with a user.
 *
 * Creates a local conversation with UUIDv7 and tells the server to persist it.
 * The same ID is used everywhere — no virtual-to-real swapping needed.
 *
 * @module hooks/useStartConversation
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { db, createLocalConversation, enqueue } from '@/lib/db'
import { useAuthStore } from '@/store/auth'
import { useNetworkStatus } from './useNetworkStatus'
import { emitCreateConversation } from '@/lib/services/socket/emitters'

interface UseStartConversationResult {
  /** Whether a conversation is currently being created. */
  isCreating: boolean;
  /** Initiate conversation with a user by their ID. */
  startChat: (userId: string) => Promise<void>;
}

/**
 * Provides a `startChat` callback that creates or finds a conversation
 * with the given user and navigates to it.
 *
 * @param onSuccess - Optional callback when navigation happens (e.g. close users panel)
 */
export function useStartConversation(
  onSuccess?: () => void,
): UseStartConversationResult {
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();
  const { user } = useAuthStore()
  const isOnline = useNetworkStatus()

  const startChat = useCallback(
    async (userId: string) => {
      if (isCreating || !user) return
      setIsCreating(true)

      const currentUserId = user.id

      try {
        // 1. Create or find a local conversation in IndexedDB.
        //    New conversations get a UUIDv7 — the same ID the server will use.
        const result = await createLocalConversation(db, userId, currentUserId)

        if (!result) {
          throw new Error(
            'Failed to create conversation: target user not found locally',
          )
        }

        const { conversationId, isNew } = result

        // 2. If it already exists (real or previously created), just navigate.
        if (!isNew) {
          router.push(`/chats/${conversationId}`)
          onSuccess?.()
          return
        }

        // 3. New conversation — tell the server to persist it with the same ID.
        const payload = {
          conversationId,
          participantIds: [currentUserId, userId],
        }

        if (isOnline) {
          await emitCreateConversation(payload)
        } else {
          // Queue for background sync if offline
          await enqueue(db, 'CONVERSATION_CREATE', payload)
        }

        // 4. Navigate immediately — UI uses the local conversation.
        router.push(`/chats/${conversationId}`)
        onSuccess?.()
      } catch (error) {
        console.error('[useStartConversation] Failed:', error)
      } finally {
        setIsCreating(false)
      }
    },
    [router, isCreating, onSuccess, user, isOnline],
  )

  return { isCreating, startChat };
}
