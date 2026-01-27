import { db } from '../../kysely/db';

export async function findPrivateConversation(userId1: string, userId2: string) {
  return await db
    .selectFrom('conversation as c')
    .innerJoin('participant as p1', 'c.id', 'p1.conversation_id')
    .innerJoin('participant as p2', 'c.id', 'p2.conversation_id')
    .where('c.type', '=', 'private')
    .where('p1.user_id', '=', userId1)
    .where('p2.user_id', '=', userId2)
    .select('c.id')
    .executeTakeFirst();
}
