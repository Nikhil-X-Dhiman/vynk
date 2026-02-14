import { db } from '../../kysely/db';

type UpdateConversationParams = {
  conversationId: string;
  adminUserId: string;
  title?: string;
  groupImg?: string;
  groupBio?: string;
  isDeleted?: boolean;
};

type UpdateConversationResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Updates a conversation metadata.
 * Only admins can update group conversations.
 *
 * @param params - Conversation details and admin user ID
 * @returns Success or error
 */
async function updateConversation(
  params: UpdateConversationParams,
): Promise<UpdateConversationResult> {
  const { conversationId, adminUserId, title, groupImg, groupBio, isDeleted } = params;

  try {
    // Verify user is admin
    const participant = await db
      .selectFrom('participant')
      .select('role')
      .where('conversation_id', '=', conversationId)
      .where('user_id', '=', adminUserId)
      .executeTakeFirst();

    if (participant?.role !== 'admin') {
      return { success: false, error: 'Only admins can update conversation' };
    }

    await db
      .updateTable('conversation')
      .set({
        ...(title !== undefined && { title }),
        ...(groupImg !== undefined && { group_img: groupImg }),
        ...(groupBio !== undefined && { group_bio: groupBio }),
        ...(isDeleted !== undefined && { is_deleted: isDeleted }),
        updated_at: new Date(),
      })
      .where('id', '=', conversationId)
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Error updating conversation:', error);
    return { success: false, error: 'Failed to update conversation' };
  }
}

export { updateConversation };
export type { UpdateConversationParams, UpdateConversationResult };
