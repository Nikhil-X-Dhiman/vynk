import { v7 as uuidv7 } from 'uuid'
import { db } from '../../kysely/db'

type SendFriendRequestParams = {
  userId: string
  friendId: string
}

type SendFriendRequestResult =
  | { success: true; data: { requestId: string } }
  | { success: false; error: string }

/**
 * Sends a friend request from one user to another.
 * Uses ON CONFLICT to prevent duplicate requests.
 *
 * @param params - Sender and recipient user IDs
 * @returns Success with request ID or error
 */
async function sendFriendRequest(
  params: SendFriendRequestParams,
): Promise<SendFriendRequestResult> {
  const { userId, friendId } = params

  if (userId === friendId) {
    return { success: false, error: 'Cannot send friend request to yourself' }
  }

  const requestId = uuidv7()

  try {
    const result = await db
      .insertInto('friendship')
      .values({
        id: requestId,
        user_id: userId,
        friend_id: friendId,
        status: 'PENDING',
        updated_at: new Date(),
      })
      .onConflict((oc) => oc.columns(['user_id', 'friend_id']).doNothing())
      .returning('id')
      .executeTakeFirst()

    if (!result) {
      return { success: false, error: 'Friend request already exists' }
    }

    return { success: true, data: { requestId } }
  } catch (error) {
    console.error('Error sending friend request:', error)
    return { success: false, error: 'Failed to send friend request' }
  }
}

export { sendFriendRequest }
export type { SendFriendRequestParams, SendFriendRequestResult }
