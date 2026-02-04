import { db } from '../../kysely/db';

/**
 * Fetches all registered users from the database
 * @param excludeUserId - Optional user ID to exclude (typically the current user)
 * @returns Array of user objects with id, name, avatar, bio, phoneNumber, and updatedAt
 */
export async function getAllUsers(excludeUserId?: string) {
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

  return await query.execute();
}

/**
 * Fetches users that have been updated since a given timestamp (for delta sync)
 * @param since - Date to filter by
 * @param excludeUserId - Optional user ID to exclude
 * @returns Array of user objects updated after the given date
 */
export async function getUsersDelta(since: Date, excludeUserId?: string) {
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

  return await query.execute();
}
