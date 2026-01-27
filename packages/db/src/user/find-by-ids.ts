import { db } from '../../kysely/db';

export async function findUsersByIds(userIds: string[]) {
  if (!userIds.length) return [];

  return await db
      .selectFrom('user')
      .select(['id', 'user_name as name', 'avatar_url as avatar'])
      .where('id', 'in', userIds)
      .execute();
}
