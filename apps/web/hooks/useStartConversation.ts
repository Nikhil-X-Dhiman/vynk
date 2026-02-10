/**
 * @fileoverview Hook for starting a conversation with a user.
 *
 * Handles virtual conversation creation, server action fallback,
 * and navigation to the new conversation.
 *
 * @module hooks/useStartConversation
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/db';
import { startConversation } from '@/app/actions/conversations';

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

  const startChat = useCallback(
    async (userId: string) => {
      if (isCreating) return;
      setIsCreating(true);

      try {
        // Try to find or create a virtual conversation locally
        const virtualConvId = await db.createVirtualConversation(userId, '');

        if (virtualConvId && !virtualConvId.startsWith('virtual-')) {
          // Existing real conversation found
          router.push(`/chats/${virtualConvId}`);
          onSuccess?.();
          return;
        }

        // Fall back to server action
        const res = await startConversation(userId);
        if (res.success && res.data) {
          if (virtualConvId) {
            await db.persistVirtualConversation(virtualConvId, res.data);
          }
          router.push(`/chats/${res.data}`);
          onSuccess?.();
        }
      } catch (error) {
        console.error('[useStartConversation] Failed:', error);
      } finally {
        setIsCreating(false);
      }
    },
    [router, isCreating, onSuccess],
  );

  return { isCreating, startChat };
}
