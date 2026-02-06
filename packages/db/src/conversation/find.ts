import { db } from '../../kysely/db';

type FindPrivateConversationResult =
  | { success: true; data: { id: string } | undefined }
  | { success: false; error: string };

/**
 * Finds an existing private conversation between two users.
 * Used to prevent duplicate private chats between the same users.
 *
 * @param userId1 - First user ID
 * @param userId2 - Second user ID
 * @returns Conversation ID if found, undefined if not exists, or error
 */
async function findPrivateConversation(
  userId1: string,
  userId2: string,
): Promise<FindPrivateConversationResult> {
  try {
    const conversation = await db
      .selectFrom('conversation as c')
      .innerJoin('participant as p1', 'c.id', 'p1.conversation_id')
      .innerJoin('participant as p2', 'c.id', 'p2.conversation_id')
      .where('c.type', '=', 'private')
      .where('c.is_deleted', '=', false)
      .where('p1.user_id', '=', userId1)
      .where('p2.user_id', '=', userId2)
      .select('c.id')
      .executeTakeFirst();

    return { success: true, data: conversation };
  } catch (error) {
    console.error('Error finding private conversation:', error);
    return { success: false, error: 'Failed to find conversation' };
  }
}

export { findPrivateConversation };
export type { FindPrivateConversationResult };
