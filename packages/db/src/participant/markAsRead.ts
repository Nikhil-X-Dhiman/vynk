import { db } from '../../kysely/db';
import { ExpressionBuilder } from 'kysely';
import { DB } from '../../kysely/generated/types';

async function markAsRead({
  conversationId,
  userId,
  lastReadMessageId,
}: {
  conversationId: string;
  userId: string;
  lastReadMessageId: string;
}) {
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
      // 2. Update Participant: set last read message and reset unread count
      await trx
        .updateTable('participant')
        .set({
          last_read_message_id: lastReadMessageId,
          unread_count: 0,
          updated_at: new Date(),
        })
        .where('participant.conversation_id', '=', conversationId)
        .where('participant.user_id', '=', userId)
        .execute();

      // 3. Update Delivery: Mark ALL messages up to this one as 'seen' for this user
      // We need to find all message IDs in this conversation that are older or equal to this message
      await trx
        .updateTable('delivery')
        .set({
          status: 'seen',
          updated_at: new Date(),
        })
        .where('user_id', '=', userId)
        .where('message_id', 'in', (eb: ExpressionBuilder<DB, 'delivery'>) =>
          eb
            .selectFrom('message')
            .select('id')
            .where('conversation_id', '=', conversationId)
            .where('created_at', '<=', messageTimestamp)
        )
        .where('status', '!=', 'seen') // Optimization: only update if not already seen
        .execute();
    });

    return { success: true };
  } catch (error) {
    console.error('Error marking as read:', error);
    return { success: false, error: 'Failed to mark as read' };
  }
}

export { markAsRead };
