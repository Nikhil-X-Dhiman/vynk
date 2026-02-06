import { db } from '../../kysely/db';
import { ExpressionBuilder } from 'kysely';
import { DB } from '../../kysely/generated/types';

type MarkAsReadParams = {
  conversationId: string;
  userId: string;
  lastReadMessageId: string;
};

type MarkAsReadResult = { success: true } | { success: false; error: string };

/**
 * Marks messages as read for a user in a conversation.
 * Atomically updates participant's last read message, resets unread count,
 * and marks all delivery records up to this message as 'seen'.
 *
 * @param params - Conversation ID, user ID, and last read message ID
 * @returns Success or error
 */
async function markAsRead(params: MarkAsReadParams): Promise<MarkAsReadResult> {
  const { conversationId, userId, lastReadMessageId } = params;

  try {
    // 1. Get the timestamp of the message being read
    const message = await db
      .selectFrom('message')
      .select('created_at')
      .where('id', '=', lastReadMessageId)
      .executeTakeFirst();

    if (!message) {
      return { success: false, error: 'Message not found' };
    }

    const messageTimestamp = message.created_at;

    await db.transaction().execute(async (trx) => {
      // 2. Update participant: set last read message and reset unread count
      await trx
        .updateTable('participant')
        .set({
          last_read_message_id: lastReadMessageId,
          unread_count: 0,
          updated_at: new Date(),
        })
        .where('conversation_id', '=', conversationId)
        .where('user_id', '=', userId)
        .execute();

      // 3. Mark all delivery records up to this message as 'seen'
      await trx
        .updateTable('delivery')
        .set({
          status: 'seen',
          updated_at: new Date(),
        })
        .where('user_id', '=', userId)
        .where('status', '!=', 'seen')
        .where('message_id', 'in', (eb: ExpressionBuilder<DB, 'delivery'>) =>
          eb
            .selectFrom('message')
            .select('id')
            .where('conversation_id', '=', conversationId)
            .where('created_at', '<=', messageTimestamp),
        )
        .execute();
    });

    return { success: true };
  } catch (error) {
    console.error('Error marking as read:', error);
    return { success: false, error: 'Failed to mark as read' };
  }
}

export { markAsRead };
export type { MarkAsReadParams, MarkAsReadResult };
