import { db } from '../../kysely/db';

type DeleteMessageResult =
  | { success: true; data: { deleted: boolean } }
  | { success: false; error: string };

/**
 * Soft-deletes a message by setting is_deleted to true.
 * Preserves the message for audit/compliance while hiding from UI.
 *
 * @param messageId - The message ID to delete
 * @returns Success with deletion status or error
 */
async function deleteMessage(messageId: string): Promise<DeleteMessageResult> {
  try {
    const result = await db
      .updateTable('message')
      .set({
        is_deleted: true,
        updated_at: new Date(),
      })
      .where('id', '=', messageId)
      .where((eb) =>
        eb.or([eb('is_deleted', '=', false), eb('is_deleted', 'is', null)]),
      )
      .executeTakeFirst();

    return {
      success: true,
      data: { deleted: Number(result.numUpdatedRows) > 0 },
    };
  } catch (error) {
    console.error('Error deleting message:', error);
    return { success: false, error: 'Failed to delete message' };
  }
}

/**
 * Hard-deletes a message from the database.
 * Use with caution - this permanently removes the message.
 *
 * @param messageId - The message ID to permanently delete
 * @returns Success with deletion status or error
 */
async function hardDeleteMessage(
  messageId: string,
): Promise<DeleteMessageResult> {
  try {
    const result = await db
      .deleteFrom('message')
      .where('id', '=', messageId)
      .executeTakeFirst();

    return {
      success: true,
      data: { deleted: Number(result.numDeletedRows) > 0 },
    };
  } catch (error) {
    console.error('Error hard-deleting message:', error);
    return { success: false, error: 'Failed to delete message' };
  }
}

export { deleteMessage, hardDeleteMessage };
export type { DeleteMessageResult };
