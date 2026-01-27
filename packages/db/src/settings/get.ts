import { db } from '../../kysely/db';

export async function getSettings(userId: string) {
  return await db
    .selectFrom('settings')
    .selectAll()
    .where('user_id', '=', userId)
    .executeTakeFirst();
}
