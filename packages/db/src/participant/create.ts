import { v7 as uuidv7 } from 'uuid'
import { db } from '../../kysely/db'

type AddParticipantParams = {
  id?: string
  conversationId: string
  userId: string
  role?: 'member' | 'admin'
}

type AddParticipantResult =
  | { success: true }
  | { success: false; error: string }

/**
 * Adds a participant to a conversation.
 * Uses ON CONFLICT to prevent duplicate entries.
 *
 * @param params - Conversation ID, user ID, and optional role
 * @returns Success or error
 */
async function addParticipant(
  params: AddParticipantParams,
): Promise<AddParticipantResult> {
  const { id, conversationId, userId, role = 'member' } = params

  try {
    await db
      .insertInto('participant')
      .values({
        id: id || uuidv7(),
        conversation_id: conversationId,
        user_id: userId,
        role,
        unread_count: 0,
        updated_at: new Date(),
      })
      .onConflict((oc) =>
        oc.columns(['conversation_id', 'user_id']).doNothing(),
      )
      .execute()

    return { success: true }
  } catch (error) {
    console.error('Error adding participant:', error)
    return { success: false, error: 'Failed to add participant' }
  }
}

export { addParticipant }
export type { AddParticipantParams, AddParticipantResult }
