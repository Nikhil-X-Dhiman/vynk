import { randomUUID } from 'crypto';
import { db } from '../../kysely/db';

type RespondToFriendRequestParams = {
  requestId: string;
  userId: string;
  action: 'accept' | 'reject';
};

type RespondToFriendRequestResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Accepts or rejects a friend request.
 * Only the recipient can respond to a request.
 *
 * @param params - Request ID, recipient user ID, and action
 * @returns Success or error
 */
async function respondToFriendRequest(
  params: RespondToFriendRequestParams
): Promise<RespondToFriendRequestResult> {
  const { requestId, userId, action } = params;

  try {
    if (action === 'accept') {
      await db
        .updateTable('friendship')
        .set({
          status: 'ACCEPTED',
          updated_at: new Date(),
        })
        .where('id', '=', requestId)
        .where('friend_id', '=', userId)
        .where('status', '=', 'PENDING')
        .execute();
    } else {
      // Reject = delete the request
      await db
        .deleteFrom('friendship')
        .where('id', '=', requestId)
        .where('friend_id', '=', userId)
        .where('status', '=', 'PENDING')
        .execute();
    }

    return { success: true };
  } catch (error) {
    console.error('Error responding to friend request:', error);
    return { success: false, error: 'Failed to respond to request' };
  }
}

type BlockUserResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Blocks a user. Updates existing friendship or creates block record.
 *
 * @param userId - Current user ID
 * @param blockedUserId - User to block
 * @returns Success or error
 */
async function blockUser(
  userId: string,
  blockedUserId: string
): Promise<BlockUserResult> {
  try {
    await db
      .insertInto('friendship')
      .values({
        id: randomUUID(),
        user_id: userId,
        friend_id: blockedUserId,
        status: 'BLOCKED',
        updated_at: new Date(),
      })
      .onConflict((oc) =>
        oc.columns(['user_id', 'friend_id']).doUpdateSet({
          status: 'BLOCKED',
          updated_at: new Date(),
        })
      )
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Error blocking user:', error);
    return { success: false, error: 'Failed to block user' };
  }
}

export { respondToFriendRequest, blockUser };
export type { RespondToFriendRequestParams, RespondToFriendRequestResult, BlockUserResult };
