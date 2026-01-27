import { redis } from '../client';
import { db } from '../../../kysely/db';

export async function getOnlineUsers() {
  const keys: string[] = [];
  let cursor = 0;

  try {
    do {
      const result = await redis.scan(cursor as any, {
        MATCH: 'presence:user:*',
        COUNT: 100,
      });
      cursor = (result.cursor as unknown) as number; // Node redis v4 usually returns number or string depending on config
      keys.push(...result.keys);
    } while (cursor !== 0);

    if (keys.length === 0) {
      return [];
    }

    // Extract user IDs from keys "presence:user:{id}"
    const userIds = keys.map((key) => key.split(':')[2]);

    // Fetch user details from Postgres in a single query
    const users = await db
      .selectFrom('user')
      .select(['id', 'user_name as name', 'avatar_url as avatar'])
      .where('id', 'in', userIds)
      .execute();

    return users;
  } catch (error) {
    console.error('Failed to get online users:', error);
    return [];
  }
}
