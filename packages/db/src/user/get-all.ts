import { db } from '../../kysely/db';

type UserListItem = {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  phoneNumber: string;
  updatedAt: Date;
};

type GetAllUsersResult =
  | { success: true; data: UserListItem[] }
  | { success: false; error: string };

/**
 * Fetches all registered users from the database.
 *
 * @param excludeUserId - Optional user ID to exclude (typically current user)
 * @returns Array of users
 */
async function getAllUsers(excludeUserId?: string): Promise<GetAllUsersResult> {
  try {
    let query = db
      .selectFrom('user')
      .select([
        'id',
        'user_name as name',
        'avatar_url as avatar',
        'bio',
        'phone_number as phoneNumber',
        'updated_at as updatedAt',
      ]);

    if (excludeUserId) {
      query = query.where('id', '!=', excludeUserId);
    }

    const users = await query.execute();
    return { success: true, data: users as UserListItem[] };
  } catch (error) {
    console.error('Error fetching all users:', error);
    return { success: false, error: 'Failed to fetch users' };
  }
}

type GetUsersDeltaParams = {
  since: Date;
  excludeUserId?: string;
};

type GetUsersDeltaResult =
  | { success: true; data: UserListItem[] }
  | { success: false; error: string };

/**
 * Fetches users updated since a given timestamp (for delta sync).
 *
 * @param params - Since date and optional user to exclude
 * @returns Array of users updated after the given date
 */
async function getUsersDelta(
  params: GetUsersDeltaParams,
): Promise<GetUsersDeltaResult> {
  const { since, excludeUserId } = params;

  try {
    let query = db
      .selectFrom('user')
      .select([
        'id',
        'user_name as name',
        'avatar_url as avatar',
        'bio',
        'phone_number as phoneNumber',
        'updated_at as updatedAt',
      ])
      .where('updated_at', '>', since);

    if (excludeUserId) {
      query = query.where('id', '!=', excludeUserId);
    }

    const users = await query.execute();
    return { success: true, data: users as UserListItem[] };
  } catch (error) {
    console.error('Error fetching users delta:', error);
    return { success: false, error: 'Failed to fetch users' };
  }
}

export { getAllUsers, getUsersDelta };
export type {
  UserListItem,
  GetAllUsersResult,
  GetUsersDeltaParams,
  GetUsersDeltaResult,
};
