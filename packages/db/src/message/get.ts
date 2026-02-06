import { db } from '../../kysely/db';

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  media_type: string | null;
  media_url: string | null;
  reply_to: string | null;
  is_deleted: boolean | null;
  created_at: Date;
  updated_at: Date;
};

type GetMessagesParams = {
  conversationId: string;
  limit?: number;
  offset?: number;
};

type GetMessagesResult =
  | { success: true; data: Message[] }
  | { success: false; error: string };

/**
 * Gets paginated messages for a conversation.
 * Returns messages in descending order (newest first).
 *
 * @param params - Conversation ID and pagination options
 * @returns List of messages or error
 */
async function getMessages(
  params: GetMessagesParams,
): Promise<GetMessagesResult> {
  const { conversationId, limit = 50, offset = 0 } = params;

  try {
    const messages = await db
      .selectFrom('message')
      .select([
        'id',
        'conversation_id',
        'sender_id',
        'content',
        'media_type',
        'media_url',
        'reply_to',
        'is_deleted',
        'created_at',
        'updated_at',
      ])
      .where('conversation_id', '=', conversationId)
      .where((eb) =>
        eb.or([eb('is_deleted', '=', false), eb('is_deleted', 'is', null)]),
      )
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();

    return { success: true, data: messages as Message[] };
  } catch (error) {
    console.error('Error fetching messages:', error);
    return { success: false, error: 'Failed to fetch messages' };
  }
}

type GetMessageByIdResult =
  | { success: true; data: Message | undefined }
  | { success: false; error: string };

/**
 * Gets a single message by ID.
 *
 * @param messageId - The message ID
 * @returns Message data or undefined if not found
 */
async function getMessageById(
  messageId: string,
): Promise<GetMessageByIdResult> {
  try {
    const message = await db
      .selectFrom('message')
      .select([
        'id',
        'conversation_id',
        'sender_id',
        'content',
        'media_type',
        'media_url',
        'reply_to',
        'is_deleted',
        'created_at',
        'updated_at',
      ])
      .where('id', '=', messageId)
      .executeTakeFirst();

    return { success: true, data: message as Message | undefined };
  } catch (error) {
    console.error('Error fetching message:', error);
    return { success: false, error: 'Failed to fetch message' };
  }
}

export { getMessages, getMessageById };
export type {
  Message,
  GetMessagesParams,
  GetMessagesResult,
  GetMessageByIdResult,
};
