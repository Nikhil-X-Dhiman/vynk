import { db } from '../../kysely/db';

type DeleteConversationResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Soft-deletes a conversation.
 * Only creator or admin can delete.
 *
 * @param conversationId - The conversation ID
 * @param userId - The user ID attempting deletion
 * @returns Success or error
 */
async function deleteConversation(
  conversationId: string,
  userId: string,
): Promise<DeleteConversationResult> {
  try {
    // Verify user is creator or admin
    const conversation = await db
      .selectFrom('conversation')
      .select(['created_by'])
      .where('id', '=', conversationId)
      .executeTakeFirst();

    if (conversation?.created_by !== userId) {
      const participant = await db
        .selectFrom('participant')
        .select('role')
        .where('conversation_id', '=', conversationId)
        .where('user_id', '=', userId)
        .executeTakeFirst();

      if (participant?.role !== 'admin') {
        return { success: false, error: 'Only creator or admin can delete conversation' };
      }
    }

    await db
      .updateTable('conversation')
      .set({ is_deleted: true, updated_at: new Date() })
      .where('id', '=', conversationId)
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return { success: false, error: 'Failed to delete conversation' };
  }
}

export { deleteConversation };
export type { DeleteConversationResult };
