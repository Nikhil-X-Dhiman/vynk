import { sql } from 'kysely';
import { db } from '../../kysely/db';

type ConversationListItem = {
  id: string
  updatedAt: Date
  name: string | null
  groupImg: string | null
  lastMessageId: string | null
  conversationType: 'private' | 'group' | 'broadcast'
}

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
      .selectFrom('conversation as c')
      .innerJoin('participant as p', 'p.conversation_id', 'c.id')
      .select([
        'c.id',
        'c.title as name',
        'c.group_img as groupImg',
        'c.type as conversationType',
        'c.updated_at as updatedAt',
        'c.last_message_id as lastMessageId',
      ])
      .where('p.user_id', '=', userId)
      .where((eb) =>
        eb.or([eb('c.is_deleted', '=', false), eb('c.is_deleted', 'is', null)]),
      )
      .orderBy('c.updated_at', 'desc')
      .execute()
    return { success: true, data: conversations as ConversationListItem[] };
  } catch (error) {
    console.error('Error fetching user conversations:', error);
    return { success: false, error: 'Failed to fetch conversations' };
  }
}

export { getUserConversations };
export type { ConversationListItem, GetUserConversationsResult };
