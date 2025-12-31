import { db } from '../../kysely/db';

async function getMessages(conversationId: string, limit = 30) {
  return db
    .selectFrom('message')
    .selectAll()
    .where('message.conversation_id', '=', conversationId)
    .orderBy('message.created_at', 'desc')
    .limit(limit)
    .execute();
}

export { getMessages };
