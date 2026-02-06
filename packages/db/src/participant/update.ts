import { db } from '../../kysely/db';

type UpdateParticipantRoleResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Updates a participant's role in a conversation.
 *
 * @param conversationId - The conversation ID
 * @param userId - The user ID to update
 * @param role - New role (member or admin)
 * @returns Success or error
 */
async function updateParticipantRole(
  conversationId: string,
  userId: string,
  role: 'member' | 'admin'
): Promise<UpdateParticipantRoleResult> {
  try {
    await db
      .updateTable('participant')
      .set({
        role,
        updated_at: new Date(),
      })
      .where('conversation_id', '=', conversationId)
      .where('user_id', '=', userId)
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Error updating participant role:', error);
    return { success: false, error: 'Failed to update role' };
  }
}

type ResetUnreadCountResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Resets the unread count for a participant without marking messages as read.
 * Useful for when user opens a conversation but hasn't scrolled to the end.
 *
 * @param conversationId - The conversation ID
 * @param userId - The user ID
 * @returns Success or error
 */
async function resetUnreadCount(
  conversationId: string,
  userId: string
): Promise<ResetUnreadCountResult> {
  try {
    await db
      .updateTable('participant')
      .set({
        unread_count: 0,
        updated_at: new Date(),
      })
      .where('conversation_id', '=', conversationId)
      .where('user_id', '=', userId)
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Error resetting unread count:', error);
    return { success: false, error: 'Failed to reset unread count' };
  }
}

export { updateParticipantRole, resetUnreadCount };
export type { UpdateParticipantRoleResult, ResetUnreadCountResult };
