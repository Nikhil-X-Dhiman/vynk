import { sql } from 'kysely';
import { db } from '../../kysely/db';

type ConversationListItem = {
  id: string;
  updated_at: Date;
  name: string | null;
  group_img: string | null;
  unread_count: number;
  last_message: string | null;
  last_message_at: Date | null;
  media_type: string | null;
  is_group: boolean;
};

type GetUserConversationsResult =
  | { success: true; data: ConversationListItem[] }
  | { success: false; error: string };

/**
 * Gets all conversations for a user with last message preview.
 * Returns conversations sorted by most recently updated.
 *
 * @param userId - The user ID to fetch conversations for
 * @returns List of conversations with metadata or error
 */
async function getUserConversations(
  userId: string,
): Promise<GetUserConversationsResult> {
  try {
    const conversations = await db
      .selectFrom('participant as p')
      .innerJoin('conversation as c', 'p.conversation_id', 'c.id')
      .leftJoin('message as m', 'c.last_message_id', 'm.id')
      .select([
        'c.id',
        'c.updated_at',
        'c.title as name',
        'c.group_img',
        'p.unread_count',
        'm.content as last_message',
        'm.created_at as last_message_at',
        'm.media_type',
      ])
      .select(sql<boolean>`c.type = 'group'`.as('is_group'))
      .where('p.user_id', '=', userId)
      .where('c.is_deleted', '=', false)
      .orderBy('c.updated_at', 'desc')
      .execute();

    return { success: true, data: conversations as ConversationListItem[] };
  } catch (error) {
    console.error('Error fetching user conversations:', error);
    return { success: false, error: 'Failed to fetch conversations' };
  }
}

export { getUserConversations };
export type { ConversationListItem, GetUserConversationsResult };
