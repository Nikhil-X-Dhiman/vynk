/**
 * @fileoverview Hook for starting a conversation.
 *
 * Capabilities:
 * - Creates local conversation immediately
 * - Emits creation event to server via socket
 * - Enforces online-only operation for creating new conversations
 *
 * @module hooks/useStartConversation
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { db, createLocalConversation } from '@/lib/db' // removed enqueue
import { useAuthStore } from '@/store/auth'
import { useNetworkStatus } from './useNetworkStatus'
import { emitCreateConversation } from '@/lib/services/socket/emitters'

interface UseStartConversationResult {
  isCreating: boolean
  startChat: (userId: string) => Promise<void>
}

/**
 * Returns a callback to start a conversation.
 *
 * @param onSuccess - Optional callback on successful navigation
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
      // 1. Validation
      if (isCreating || !user) return

      if (!isOnline) {
        console.warn('[useStartConversation] Cannot start chat while offline')
        // Optionally show toast here
        return
      }

      setIsCreating(true)

      const currentUserId = user.id

      try {
        // 2. Local Creation / Lookup
        const result = await createLocalConversation(db, userId, currentUserId)

        if (!result) {
          throw new Error('Failed to create conversation locally')
        }

        const { conversationId, isNew } = result

        // 3. If exists (real or previously created), just navigate
        if (!isNew) {
          router.push(`/chats/${conversationId}`)
          onSuccess?.()
          return
        }

        // 4. New conversation -> Persist to server
        const payload = {
          conversationId,
          participantIds: [currentUserId, userId],
        }

        // We already checked isOnline above, so we can emit directly
        await emitCreateConversation(payload).catch((err) => {
          console.error('[useStartConversation] Failed to emit create:', err)
          // We navigate anyway because we have a local optimistic conversation?
          // Or should we fail?
          // For now, consistent with "no offline queue", if emit fails, maybe we warn?
          // but let's proceed to navigate optimistically.
        })

        // 5. Navigate
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
