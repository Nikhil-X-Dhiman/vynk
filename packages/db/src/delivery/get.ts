import { db } from '../../kysely/db';

type DeliveryStatus = {
  userId: string
  status: string | null
  updatedAt: Date
}

type GetMessageDeliveryStatusResult =
  | { success: true; data: DeliveryStatus[] }
  | { success: false; error: string };

/**
 * Gets delivery status for all recipients of a message.
 *
 * @param messageId - The message ID to check
 * @returns List of delivery statuses per user
 */
async function getMessageDeliveryStatus(
  messageId: string
): Promise<GetMessageDeliveryStatusResult> {
  try {
    const statuses = await db
      .selectFrom('delivery')
      .select(['user_id as userId', 'status', 'updated_at as updatedAt'])
      .where('message_id', '=', messageId)
      .execute()

    return { success: true, data: statuses as DeliveryStatus[] }
  } catch (error) {
    console.error('Error fetching delivery status:', error);
    return { success: false, error: 'Failed to fetch delivery status' };
  }
}

export { getMessageDeliveryStatus };
export type { DeliveryStatus, GetMessageDeliveryStatusResult };
