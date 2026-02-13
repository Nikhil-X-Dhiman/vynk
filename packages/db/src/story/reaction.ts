import { v7 as uuidv7 } from 'uuid'
import { db } from '../../kysely/db'

type ToggleStoryReactionParams = {
  storyId: string
  userId: string
  emoji: string
}

type ToggleStoryReactionResult =
  | { success: true; data: { action: 'added' | 'updated' | 'removed' } }
  | { success: false; error: string }

/**
 * Toggles a reaction on a story.
 * - If no reaction exists, adds one
 * - If same emoji exists, removes it
 * - If different emoji exists, updates it
 *
 * @param params - Story ID, user ID, and emoji
 * @returns Success with action taken or error
 */
async function toggleStoryReaction(
  params: ToggleStoryReactionParams,
): Promise<ToggleStoryReactionResult> {
  const { storyId, userId, emoji } = params

  try {
    const existing = await db
      .selectFrom('reaction')
      .select(['id', 'emoji'])
      .where('story_id', '=', storyId)
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
        story_id: storyId,
        user_id: userId,
        emoji,
      })
      .execute()

    return { success: true, data: { action: 'added' } }
  } catch (error) {
    console.error('Error toggling story reaction:', error)
    return { success: false, error: 'Failed to toggle reaction' }
  }
}

type StoryReaction = {
  id: string
  user_id: string
  emoji: string | null
  created_at: Date
}

type GetStoryReactionsResult =
  | { success: true; data: StoryReaction[] }
  | { success: false; error: string }

/**
 * Gets all reactions for a story.
 *
 * @param storyId - The story ID
 * @returns List of reactions
 */
async function getStoryReactions(
  storyId: string,
): Promise<GetStoryReactionsResult> {
  try {
    const reactions = await db
      .selectFrom('reaction')
      .select(['id', 'user_id', 'emoji', 'created_at'])
      .where('story_id', '=', storyId)
      .execute()

    return { success: true, data: reactions }
  } catch (error) {
    console.error('Error fetching story reactions:', error)
    return { success: false, error: 'Failed to fetch reactions' }
  }
}

export { toggleStoryReaction, getStoryReactions }
export type {
  ToggleStoryReactionParams,
  ToggleStoryReactionResult,
  StoryReaction,
  GetStoryReactionsResult,
}
