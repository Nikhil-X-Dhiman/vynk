import { db } from '../../kysely/db';

type Conversation = {
  id: string;
  type: 'private' | 'group' | 'broadcast';
  title: string | null;
  created_by: string;
  group_img: string | null;
  group_bio: string | null;
  last_message_id: string | null;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
};

type GetConversationResult =
  | { success: true; data: Conversation | undefined }
  | { success: false; error: string };

/**
 * Gets a single conversation by ID.
 *
 * @param conversationId - The conversation ID to fetch
 * @returns Conversation data or undefined if not found, or error
 */
async function getConversation(
  conversationId: string,
): Promise<GetConversationResult> {
  try {
    const conversation = await db
      .selectFrom('conversation')
      .select([
        'id',
        'type',
        'title',
        'created_by',
        'group_img',
        'group_bio',
        'last_message_id',
        'is_deleted',
        'created_at',
        'updated_at',
      ])
      .where('id', '=', conversationId)
      .where('is_deleted', '=', false)
      .executeTakeFirst();

    return { success: true, data: conversation as Conversation | undefined };
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return { success: false, error: 'Failed to fetch conversation' };
  }
}

export { getConversation };
export type { Conversation, GetConversationResult };
