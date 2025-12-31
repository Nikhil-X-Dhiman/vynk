import { randomUUID } from 'crypto';
import { db } from '../../kysely/db';

async function sendMessage({
  conversationId,
  senderId,
  mediaUrl,
  mediaType,
  content,
  replyTo,
}: {
  conversationId: string;
  senderId: string;
  mediaUrl?: string;
  mediaType?: 'text' | 'image' | 'video' | 'file';
  content?: string;
  replyTo?: string;
}) {
  const messageId = randomUUID();

  await db
    .insertInto('message')
    .values({
      id: messageId,
      conversation_id: conversationId,
      sender_id: senderId,
      media_type: mediaType,
      media_url: mediaUrl,
      content,
      reply_to: replyTo,
      updated_at: new Date(),
    })
    .execute();
  await db
    .updateTable('conversation')
    .set({
      last_message_id: messageId,
    })
    .where('conversation.id', '=', conversationId)
    .execute();
  await db
    .updateTable('participant')
    .set({
      unread_count: (eb) => eb('participant.unread_count', '+', 1),
    })
    .where('participant.conversation_id', '=', conversationId)
    .where('participant.user_id', '!=', senderId)
    .execute();

  return messageId;
}

export { sendMessage };
