import { db } from '../../kysely/db';

type Friend = {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
};

type GetFriendsResult =
  | { success: true; data: Friend[] }
  | { success: false; error: string };

/**
 * Gets all accepted friends for a user.
 *
 * @param userId - The user ID
 * @returns List of friends
 */
async function getFriends(userId: string): Promise<GetFriendsResult> {
  try {
    // Friends where user sent the request
    const sentFriends = await db
      .selectFrom('friendship as f')
      .innerJoin('user as u', 'f.friend_id', 'u.id')
      .select([
        'u.id',
        'u.user_name as name',
        'u.avatar_url as avatar',
        'u.bio',
      ])
      .where('f.user_id', '=', userId)
      .where('f.status', '=', 'ACCEPTED')
      .execute();

    // Friends where user received the request
    const receivedFriends = await db
      .selectFrom('friendship as f')
      .innerJoin('user as u', 'f.user_id', 'u.id')
      .select([
        'u.id',
        'u.user_name as name',
        'u.avatar_url as avatar',
        'u.bio',
      ])
      .where('f.friend_id', '=', userId)
      .where('f.status', '=', 'ACCEPTED')
      .execute();

    const friends = [...sentFriends, ...receivedFriends] as Friend[];
    return { success: true, data: friends };
  } catch (error) {
    console.error('Error fetching friends:', error);
    return { success: false, error: 'Failed to fetch friends' };
  }
}

type FriendRequest = {
  id: string;
  userId: string;
  name: string;
  avatar: string | null;
  createdAt: Date;
};

type GetPendingRequestsResult =
  | { success: true; data: FriendRequest[] }
  | { success: false; error: string };

/**
 * Gets pending friend requests received by a user.
 *
 * @param userId - The user ID
 * @returns List of pending requests
 */
async function getPendingFriendRequests(
  userId: string
): Promise<GetPendingRequestsResult> {
  try {
    const requests = await db
      .selectFrom('friendship as f')
      .innerJoin('user as u', 'f.user_id', 'u.id')
      .select([
        'f.id',
        'u.id as userId',
        'u.user_name as name',
        'u.avatar_url as avatar',
        'f.created_at as createdAt',
      ])
      .where('f.friend_id', '=', userId)
      .where('f.status', '=', 'PENDING')
      .orderBy('f.created_at', 'desc')
      .execute();

    return { success: true, data: requests as FriendRequest[] };
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    return { success: false, error: 'Failed to fetch requests' };
  }
}

export { getFriends, getPendingFriendRequests };
export type { Friend, GetFriendsResult, FriendRequest, GetPendingRequestsResult };
