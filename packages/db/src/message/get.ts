import { db } from '../../kysely/db';

type Message = {
  id: string
  conversationId: string
  senderId: string
  content: string | null
  mediaType: string | null
  mediaUrl: string | null
  replyTo: string | null
  isDeleted: boolean | null
  createdAt: Date
  updatedAt: Date
}

type GetMessagesResult =
  | { success: true; data: Message[] }
  | { success: false; error: string };

/**
 * Gets all messages for all conversations a user is part of.
 *
 * @param userId - The user ID to fetch messages for
 * @returns List of messages or error
 */
async function getUserMessages(userId: string): Promise<GetMessagesResult> {
  try {
    const messages = await db
      .selectFrom('message as m')
      .innerJoin('participant as p', 'm.conversation_id', 'p.conversation_id')
      .select([
        'm.id',
        'm.conversation_id as conversationId',
        'm.sender_id as senderId',
        'm.content',
        'm.media_type as mediaType',
        'm.media_url as mediaUrl',
        'm.reply_to as replyTo',
        'm.is_deleted as isDeleted',
        'm.created_at as createdAt',
        'm.updated_at as updatedAt',
      ])
      .where('p.user_id', '=', userId)
      .where((eb) =>
        eb.or([eb('m.is_deleted', '=', false), eb('m.is_deleted', 'is', null)]),
      )
      .orderBy('m.created_at', 'desc')
      .execute()

    return { success: true, data: messages as Message[] }
  } catch (error) {
    console.error('Error fetching user messages:', error)
    return { success: false, error: 'Failed to fetch messages' }
  }
}

export { getUserMessages }
export type { Message, GetMessagesResult }
