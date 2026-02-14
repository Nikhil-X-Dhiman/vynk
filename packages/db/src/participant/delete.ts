import { db } from '../../kysely/db';

type RemoveParticipantResult =
  | { success: true }
  | { success: false; error: string }

/**
 * Removes a participant from a conversation.
 *
 * @param conversationId - The conversation ID
 * @param participantId - The user ID to remove
 * @param requesterId - The user ID requesting the removal (must be admin or the participant itself)
 * @returns Success or error
 */
async function removeParticipant(
  conversationId: string,
  participantId: string,
  requesterId: string,
): Promise<RemoveParticipantResult> {
  try {
    // Allow self-removal or admin removal
    if (participantId !== requesterId) {
      const currentParticipant = await db
        .selectFrom('participant')
        .select('role')
        .where('conversation_id', '=', conversationId)
        .where('user_id', '=', requesterId)
        .executeTakeFirst()

      if (currentParticipant?.role !== 'admin') {
        return {
          success: false,
          error: 'Only admins can remove other participants',
        }
      }
    }

    await db
      .deleteFrom('participant')
      .where('conversation_id', '=', conversationId)
      .where('user_id', '=', participantId)
      .execute()

    return { success: true }
  } catch (error) {
    console.error('Error removing participant:', error)
    return { success: false, error: 'Failed to remove participant' }
  }
}

export { removeParticipant };
export type { RemoveParticipantResult };
