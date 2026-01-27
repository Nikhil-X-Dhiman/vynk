import { db } from '../../kysely/db';

export async function getUserConversations(userId: string) {
  return await db
    .selectFrom('participant as p')
    .innerJoin('conversation as c', 'p.conversation_id', 'c.id')
    .leftJoin('message as m', 'c.last_message_id', 'm.id')
    .select([
      'c.id',
      'c.updated_at',
      'c.name',
      'c.is_group',
      'c.group_img',
      'p.unread_count',
      'm.content as last_message',
      'm.created_at as last_message_at',
      'm.media_type'
    ])
    .where('p.user_id', '=', userId)
    .orderBy('c.updated_at', 'desc')
    .execute();
}
