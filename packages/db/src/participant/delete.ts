import { db } from '../../kysely/db';

type RemoveParticipantResult =
  | { success: true; data: { removed: boolean } }
  | { success: false; error: string };

/**
 * Removes a participant from a conversation.
 *
 * @param conversationId - The conversation ID
 * @param userId - The user ID to remove
 * @returns Success with removal status or error
 */
async function removeParticipant(
  conversationId: string,
  userId: string
): Promise<RemoveParticipantResult> {
  try {
    const result = await db
      .deleteFrom('participant')
      .where('conversation_id', '=', conversationId)
      .where('user_id', '=', userId)
      .executeTakeFirst();

    return {
      success: true,
      data: { removed: Number(result.numDeletedRows) > 0 },
    };
  } catch (error) {
    console.error('Error removing participant:', error);
    return { success: false, error: 'Failed to remove participant' };
  }
}

export { removeParticipant };
export type { RemoveParticipantResult };
