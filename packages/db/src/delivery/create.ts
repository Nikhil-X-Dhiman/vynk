import { randomUUID } from 'crypto';
import { db } from '../../kysely/db';

type CreateDeliveryParams = {
  messageId: string;
  userIds: string[];
};

type CreateDeliveryResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Creates delivery records for a message to multiple recipients.
 * Each recipient gets their own delivery tracking record.
 *
 * @param params - Message ID and list of recipient user IDs
 * @returns Success or error
 */
async function createDelivery(
  params: CreateDeliveryParams,
): Promise<CreateDeliveryResult> {
  const { messageId, userIds } = params;

  if (userIds.length === 0) {
    return { success: true };
  }

  try {
    await db
      .insertInto('delivery')
      .values(
        userIds.map((userId) => ({
          id: randomUUID(),
          message_id: messageId,
          user_id: userId,
          status: 'sent' as const,
          updated_at: new Date(),
        })),
      )
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Error creating delivery:', error);
    return { success: false, error: 'Failed to create delivery' };
  }
}

export { createDelivery };
export type { CreateDeliveryParams, CreateDeliveryResult };
