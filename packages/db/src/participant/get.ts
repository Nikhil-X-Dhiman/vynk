import { db } from '../../kysely/db'

type Participant = {
  id: string
  conversationId: string
  userId: string
  role: string | null
  unreadCount: number
  lastReadMessageId: string | null
  joinedAt: Date
  updatedAt: Date
}

type GetParticipantsResult =
  | { success: true; data: Participant[] }
  | { success: false; error: string }

/**
 * Gets all participants for a conversation.
 *
 * @param conversationId - The conversation ID
 * @returns List of participants
 */
async function getParticipants(
  conversationId: string,
): Promise<GetParticipantsResult> {
  try {
    const participants = await db
      .selectFrom('participant')
      .select([
        'id',
        'conversation_id as conversationId',
        'user_id as userId',
        'role',
        'unread_count as unreadCount',
        'last_read_message_id as lastReadMessageId',
        'joined_at as joinedAt',
        'updated_at as updatedAt',
      ])
      .where('conversation_id', '=', conversationId)
      .execute()

    return { success: true, data: participants as Participant[] }
  } catch (error) {
    console.error('Error fetching participants:', error)
    return { success: false, error: 'Failed to fetch participants' }
  }
}

type GetParticipantResult =
  | { success: true; data: Participant | undefined }
  | { success: false; error: string }

/**
 * Gets a specific participant in a conversation.
 *
 * @param conversationId - The conversation ID
 * @param userId - The user ID
 * @returns Participant data or undefined
 */
async function getParticipant(
  conversationId: string,
  userId: string,
): Promise<GetParticipantResult> {
  try {
    const participant = await db
      .selectFrom('participant')
      .select([
        'id',
        'conversation_id as conversationId',
        'user_id as userId',
        'role',
        'unread_count as unreadCount',
        'last_read_message_id as lastReadMessageId',
        'joined_at as joinedAt',
        'updated_at as updatedAt',
      ])
      .where('conversation_id', '=', conversationId)
      .where('user_id', '=', userId)
      .executeTakeFirst()

    return { success: true, data: participant as Participant | undefined }
  } catch (error) {
    console.error('Error fetching participant:', error)
    return { success: false, error: 'Failed to fetch participant' }
  }
}

/**
 * Gets all participants for all conversations the user is part of.
 * Use for initial sync.
 *
 * @param userId - The user ID
 * @returns List of participants
 */
async function getUserParticipants(
  userId: string,
): Promise<GetParticipantsResult> {
  try {
    const participants = await db
      .selectFrom('participant as p1')
      .innerJoin(
        'participant as p2',
        'p1.conversation_id',
        'p2.conversation_id',
      )
      .select([
        'p2.id',
        'p2.conversation_id as conversationId',
        'p2.user_id as userId',
        'p2.role',
        'p2.unread_count as unreadCount',
        'p2.last_read_message_id as lastReadMessageId',
        'p2.joined_at as joinedAt',
        'p2.updated_at as updatedAt',
      ])
      .where('p1.user_id', '=', userId)
      .execute()

    return { success: true, data: participants as Participant[] }
  } catch (error) {
    console.error('Error fetching user participants:', error)
    return { success: false, error: 'Failed to fetch user participants' }
  }
}

export { getParticipants, getParticipant, getUserParticipants }
export type { Participant, GetParticipantsResult, GetParticipantResult }
