import { randomUUID } from 'crypto';
import { db } from '../../kysely/db';

async function toggleReaction({
  messageId,
  userId,
  emoji,
}: {
  messageId: string;
  userId: string;
  emoji: string;
}) {
  const existing = await db
    .selectFrom('reaction')
    .select('id')
    .where('message_id', '=', messageId)
    .where('user_id', '=', userId)
    .executeTakeFirst();

  if (existing) {
    return db
      .updateTable('reaction')
      .set({ emoji })
      .where('id', '=', existing.id)
      .execute();
  }

  return db
    .insertInto('reaction')
    .values({
      id: randomUUID(),
      message_id: messageId,
      user_id: userId,
      emoji,
    })
    .execute();
}

export { toggleReaction };
