import { db } from '../../kysely/db';
import { randomUUID } from 'crypto';

async function createDelivery({
  messageId,
  userIds,
}: {
  messageId: string;
  userIds: string[];
}) {
  try {
    await db
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
    return { success: true };
  } catch (error) {
    console.error('Error creating delivery:', error);
    return { success: false, error: 'Failed to create delivery' };
  }
}
