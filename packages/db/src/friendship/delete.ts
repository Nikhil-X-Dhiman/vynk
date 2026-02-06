import { db } from '../../kysely/db';

type RemoveFriendResult =
  | { success: true; data: { removed: boolean } }
  | { success: false; error: string };

/**
 * Removes a friendship between two users.
 * Either user can remove the friendship.
 *
 * @param userId - Current user ID
 * @param friendId - Friend to remove
 * @returns Success with removal status or error
 */
async function removeFriend(
  userId: string,
  friendId: string
): Promise<RemoveFriendResult> {
  try {
    const result = await db
      .deleteFrom('friendship')
      .where((eb) =>
        eb.or([
          eb.and([
            eb('user_id', '=', userId),
            eb('friend_id', '=', friendId),
          ]),
          eb.and([
            eb('user_id', '=', friendId),
            eb('friend_id', '=', userId),
          ]),
        ])
      )
      .where('status', '=', 'ACCEPTED')
      .executeTakeFirst();

    return {
      success: true,
      data: { removed: Number(result.numDeletedRows) > 0 },
    };
  } catch (error) {
    console.error('Error removing friend:', error);
    return { success: false, error: 'Failed to remove friend' };
  }
}

export { removeFriend };
export type { RemoveFriendResult };
