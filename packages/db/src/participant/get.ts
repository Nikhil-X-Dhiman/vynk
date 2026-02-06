import { randomUUID } from 'crypto';
import { db } from '../../kysely/db';

type Participant = {
  id: string;
  conversation_id: string;
  user_id: string;
  role: string | null;
  last_read_message_id: string | null;
  unread_count: number;
  joined_at: Date;
  updated_at: Date;
};

type GetParticipantsResult =
  | { success: true; data: { user_id: string; role: string | null }[] }
  | { success: false; error: string };

/**
 * Gets all participants for a conversation.
 *
 * @param conversationId - The conversation ID
 * @returns List of participant user IDs and roles
 */
async function getParticipants(
  conversationId: string,
): Promise<GetParticipantsResult> {
  try {
    const participants = await db
      .selectFrom('participant')
      .select(['user_id', 'role'])
      .where('conversation_id', '=', conversationId)
      .execute();

    return { success: true, data: participants };
  } catch (error) {
    console.error('Error fetching participants:', error);
    return { success: false, error: 'Failed to fetch participants' };
  }
}

type GetParticipantResult =
  | { success: true; data: Participant | undefined }
  | { success: false; error: string };

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
        'conversation_id',
        'user_id',
        'role',
        'last_read_message_id',
        'unread_count',
        'joined_at',
        'updated_at',
      ])
      .where('conversation_id', '=', conversationId)
      .where('user_id', '=', userId)
      .executeTakeFirst();

    return { success: true, data: participant as Participant | undefined };
  } catch (error) {
    console.error('Error fetching participant:', error);
    return { success: false, error: 'Failed to fetch participant' };
  }
}

export { getParticipants, getParticipant };
export type { Participant, GetParticipantsResult, GetParticipantResult };
