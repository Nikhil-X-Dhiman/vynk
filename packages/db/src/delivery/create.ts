import { db } from '../../kysely/db';
import { randomUUID } from 'crypto';

async function createDelivery({
  messageId,
  userIds,
}: {
  messageId: string;
  userIds: string[];
}) {
  return db
    .insertInto('delivery')
    .values(
      userIds.map((userId) => ({
        id: randomUUID(),
        message_id: messageId,
        user_id: userId,
        status: 'sent',
        updated_at: new Date(),
      }))
    )
    .execute();
}
