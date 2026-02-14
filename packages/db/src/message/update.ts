import { db } from '../../kysely/db';

type UpdateMessageParams = {
  messageId: string;
  senderId: string;
  content?: string;
  isDeleted?: boolean;
};

type UpdateMessageResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Updates a message in the database.
 * Only the sender can update their own message.
 *
 * @param params - Message details and sender ID
 * @returns Success or error
 */
async function updateMessage(params: UpdateMessageParams): Promise<UpdateMessageResult> {
  const { messageId, senderId, content, isDeleted } = params;

  try {
    await db
      .updateTable('message')
      .set({
        ...(content !== undefined && { content }),
        ...(isDeleted !== undefined && { is_deleted: isDeleted }),
        updated_at: new Date(),
      })
      .where('id', '=', messageId)
      .where('sender_id', '=', senderId)
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Error updating message:', error);
    return { success: false, error: 'Failed to update message' };
  }
}

export { updateMessage };
export type { UpdateMessageParams, UpdateMessageResult };
