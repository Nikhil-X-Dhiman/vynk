import { db } from '../../kysely/db';

export async function getConversation(conversationId: string) {
  return await db
    .selectFrom('conversation')
    .selectAll()
    .where('id', '=', conversationId)
    .executeTakeFirst();
}
