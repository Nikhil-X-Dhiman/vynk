import { db } from '../../kysely/db';

type Friend = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

type GetFriendsResult =
  | { success: true; data: Friend[] }
  | { success: false; error: string };

/**
 * Gets a list of "friends" for a user.
 * Currently defined as users who have a private conversation with the target user.
 *
 * @param userId - The user ID to fetch friends for
 * @returns Array of friends
 */
async function getFriends(userId: string): Promise<GetFriendsResult> {
  try {
    const friends = await db
      .selectFrom('user')
      .innerJoin('participant as p1', 'user.id', 'p1.user_id')
      .innerJoin('conversation', 'p1.conversation_id', 'conversation.id')
      .innerJoin('participant as p2', 'conversation.id', 'p2.conversation_id')
      .select([
        'user.id',
        'user.user_name as name',
        'user.avatar_url as avatarUrl',
      ])
      .where('p2.user_id', '=', userId)
      .where('conversation.type', '=', 'private')
      .where('user.id', '!=', userId)
      .distinct()
      .execute();

    return { success: true, data: friends };
  } catch (error) {
    console.error('Error fetching friends:', error);
    return { success: false, error: 'Failed to fetch friends' };
  }
}

export { getFriends };
export type { Friend, GetFriendsResult };
