import { db } from '../../kysely/db';

function getUserConversation(userId: string) {
  return db
    .selectFrom('conversation')
    .innerJoin('participant', 'participant.conversation_id', 'conversation.id')
    .leftJoin('message', 'message.id', 'conversation.last_message_id')
    .select([
      'conversation.id',
      'conversation.type',
      'conversation.title',
      'conversation.group_img',
      'conversation.updated_at',
      'message.content as lastMessage',
      'message.created_at as lastMessageAt',
      'participant.unread_count',
    ])
    .where('user_id', '=', userId)
    .orderBy('conversation.updated_at', 'desc')
    .execute();
}

export { getUserConversation };
