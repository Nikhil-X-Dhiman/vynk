import { db } from '../../kysely/db';

type UpdateDeliveryStatusParams = {
  messageId: string;
  userId: string;
  status: 'delivered' | 'seen';
};

type UpdateDeliveryStatusResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Updates the delivery status for a specific message and user.
 *
 * @param params - Message ID, user ID, and new status
 * @returns Success or error
 */
async function updateDeliveryStatus(
  params: UpdateDeliveryStatusParams
): Promise<UpdateDeliveryStatusResult> {
  const { messageId, userId, status } = params;

  try {
    await db
      .updateTable('delivery')
      .set({
        status,
        updated_at: new Date(),
      })
      .where('message_id', '=', messageId)
      .where('user_id', '=', userId)
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Error updating delivery status:', error);
    return { success: false, error: 'Failed to update delivery status' };
  }
}

export { updateDeliveryStatus };
export type { UpdateDeliveryStatusParams, UpdateDeliveryStatusResult };
