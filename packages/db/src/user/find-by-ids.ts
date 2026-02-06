import { db } from '../../kysely/db';

type UserBasic = {
  id: string;
  name: string;
  avatar: string | null;
};

type FindUsersByIdsResult =
  | { success: true; data: UserBasic[] }
  | { success: false; error: string };

/**
 * Finds users by their IDs.
 * Returns basic user info (id, name, avatar).
 *
 * @param userIds - Array of user IDs to find
 * @returns List of matching users
 */
async function findUsersByIds(
  userIds: string[],
): Promise<FindUsersByIdsResult> {
  if (userIds.length === 0) {
    return { success: true, data: [] };
  }

  try {
    const users = await db
      .selectFrom('user')
      .select(['id', 'user_name as name', 'avatar_url as avatar'])
      .where('id', 'in', userIds)
      .execute();

    return { success: true, data: users as UserBasic[] };
  } catch (error) {
    console.error('Error finding users by IDs:', error);
    return { success: false, error: 'Failed to find users' };
  }
}

export { findUsersByIds };
export type { UserBasic, FindUsersByIdsResult };
