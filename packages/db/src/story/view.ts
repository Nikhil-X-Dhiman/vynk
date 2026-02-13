import { v7 as uuidv7 } from 'uuid'
import { db } from '../../kysely/db'

type RecordStoryViewParams = {
  storyId: string
  userId: string
}

type RecordStoryViewResult =
  | { success: true }
  | { success: false; error: string }

/**
 * Records that a user viewed a story.
 * Uses ON CONFLICT to avoid duplicate views.
 *
 * @param params - Story ID and user ID
 * @returns Success or error
 */
async function recordStoryView(
  params: RecordStoryViewParams,
): Promise<RecordStoryViewResult> {
  const { storyId, userId } = params

  try {
    await db
      .insertInto('story_view')
      .values({
        id: uuidv7(),
        story_id: storyId,
        user_id: userId,
        viewed_at: new Date(),
        updated_at: new Date(),
      })
      .onConflict((oc) => oc.columns(['story_id', 'user_id']).doNothing())
      .execute()

    return { success: true }
  } catch (error) {
    console.error('Error recording story view:', error)
    return { success: false, error: 'Failed to record view' }
  }
}

export { recordStoryView }
export type { RecordStoryViewParams, RecordStoryViewResult }
