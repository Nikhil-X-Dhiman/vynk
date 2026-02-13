import { v7 as uuidv7 } from 'uuid'
import { db } from '../../kysely/db'

type ToggleReactionParams = {
  messageId: string
  userId: string
  emoji: string
}

type ToggleReactionResult =
  | { success: true; data: { action: 'added' | 'updated' | 'removed' } }
  | { success: false; error: string }

/**
 * Toggles a reaction on a message.
 * - If no reaction exists, adds one
 * - If same emoji exists, removes it
 * - If different emoji exists, updates it
 *
 * @param params - Message ID, user ID, and emoji
 * @returns Success with action taken or error
 */
async function toggleMessageReaction(
  params: ToggleReactionParams,
): Promise<ToggleReactionResult> {
  const { messageId, userId, emoji } = params

  try {
    const existing = await db
      .selectFrom('reaction')
      .select(['id', 'emoji'])
      .where('message_id', '=', messageId)
      .where('user_id', '=', userId)
      .executeTakeFirst()

    if (existing) {
      // Same emoji - remove reaction
      if (existing.emoji === emoji) {
        await db.deleteFrom('reaction').where('id', '=', existing.id).execute()
        return { success: true, data: { action: 'removed' } }
      }

      // Different emoji - update reaction
      await db
        .updateTable('reaction')
        .set({ emoji })
        .where('id', '=', existing.id)
        .execute()
      return { success: true, data: { action: 'updated' } }
    }

    // No existing reaction - add new
    await db
      .insertInto('reaction')
      .values({
        id: uuidv7(),
        message_id: messageId,
        user_id: userId,
        emoji,
      })
      .execute()

    return { success: true, data: { action: 'added' } }
  } catch (error) {
    console.error('Error toggling reaction:', error)
    return { success: false, error: 'Failed to toggle reaction' }
  }
}

type Reaction = {
  id: string
  userId: string
  emoji: string | null
  createdAt: Date
}

type GetMessageReactionsResult =
  | { success: true; data: Reaction[] }
  | { success: false; error: string }

/**
 * Gets all reactions for a message.
 *
 * @param messageId - The message ID
 * @returns List of reactions or error
 */
async function getMessageReactions(
  messageId: string,
): Promise<GetMessageReactionsResult> {
  try {
    const reactions = await db
      .selectFrom('reaction')
      .select(['id', 'user_id as userId', 'emoji', 'created_at as createdAt'])
      .where('message_id', '=', messageId)
      .execute()

    return { success: true, data: reactions as Reaction[] }
  } catch (error) {
    console.error('Error fetching reactions:', error)
    return { success: false, error: 'Failed to fetch reactions' }
  }
}

export { toggleMessageReaction, getMessageReactions }
export type {
  ToggleReactionParams,
  ToggleReactionResult,
  Reaction,
  GetMessageReactionsResult,
}
