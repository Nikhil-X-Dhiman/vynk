import { db } from '../../kysely/db';

async function markAsRead({
  conversationId,
  userId,
  lastReadMessageId,
}: {
  conversationId: string;
  userId: string;
  lastReadMessageId: string;
}) {
  await db
    .updateTable('participant')
    .set({
      last_read_message_id: lastReadMessageId,
      unread_count: 0,
    })
    .where('participant.conversation_id', '=', conversationId)
    .where('participant.user_id', '=', userId)
    .execute();
  await db
    .updateTable('delivery')
    .set({ status: 'seen' })
    .where('user_id', '=', userId)
    .where('message_id', '=', lastReadMessageId)
    .execute();
}

export { markAsRead };
