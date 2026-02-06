import { randomUUID } from 'crypto';
import { db } from '../../kysely/db';

type SendMessageParams = {
  conversationId: string;
  senderId: string;
  content?: string;
  mediaUrl?: string;
  mediaType?: 'text' | 'image' | 'video' | 'file';
  replyTo?: string;
};

type SendMessageResult =
  | { success: true; data: { messageId: string } }
  | { success: false; error: string };

/**
 * Sends a message in a conversation.
 * Atomically: creates message, updates conversation's last message,
 * and increments unread count for other participants.
 *
 * @param params - Message details
 * @returns Success with message ID or error
 */
async function sendMessage(
  params: SendMessageParams,
): Promise<SendMessageResult> {
  const { conversationId, senderId, content, mediaUrl, mediaType, replyTo } =
    params;
  const messageId = randomUUID();

  try {
    await db.transaction().execute(async (trx) => {
      // 1. Insert the message
      await trx
        .insertInto('message')
        .values({
          id: messageId,
          conversation_id: conversationId,
          sender_id: senderId,
          content: content ?? null,
          media_url: mediaUrl ?? null,
          media_type: mediaType ?? 'text',
          reply_to: replyTo ?? null,
          updated_at: new Date(),
        })
        .execute();

      // 2. Update conversation's last message
      await trx
        .updateTable('conversation')
        .set({
          last_message_id: messageId,
          updated_at: new Date(),
        })
        .where('id', '=', conversationId)
        .execute();

      // 3. Increment unread count for other participants
      await trx
        .updateTable('participant')
        .set((eb) => ({
          unread_count: eb('unread_count', '+', 1),
          updated_at: new Date(),
        }))
        .where('conversation_id', '=', conversationId)
        .where('user_id', '!=', senderId)
        .execute();
    });

    return { success: true, data: { messageId } };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error: 'Failed to send message' };
  }
}

export { sendMessage };
export type { SendMessageParams, SendMessageResult };
