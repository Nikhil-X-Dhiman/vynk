import { db } from '../../kysely/db';

export async function getParticipants(conversationId: string) {
  return await db
    .selectFrom('participant')
    .select(['user_id'])
    .where('conversation_id', '=', conversationId)
    .execute();
}
