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

  try {
    await db.transaction().execute(async (trx) => {
      await trx
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

      await trx
        .updateTable('conversation')
        .set({
          last_message_id: messageId,
          updated_at: new Date(),
        })
        .where('conversation.id', '=', conversationId)
        .execute();

      await trx
        .updateTable('participant')
        .set((eb) => ({
          unread_count: eb('participant.unread_count', '+', 1),
          updated_at: new Date(),
        }))
        .where('participant.conversation_id', '=', conversationId)
        .where('participant.user_id', '!=', senderId)
        .execute();
    });

    return { success: true, data: messageId };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error: 'Failed to send message' };
  }
}

export { sendMessage };
