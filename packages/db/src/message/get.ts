import { db } from '../../kysely/db';

export async function getMessages(conversationId: string, limit = 50, offset = 0) {
  return await db
    .selectFrom('message')
    .selectAll()
    .where('conversation_id', '=', conversationId)
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset)
    .execute();
}
