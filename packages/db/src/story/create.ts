import { v7 as uuidv7 } from 'uuid'
import { db } from '../../kysely/db'
import type { Media } from '../../kysely/generated/types'

type CreateStoryParams = {
  /** Optional pre-generated ID (e.g. UUIDv7 from client). */
  id?: string
  userId: string
  type: Media
  contentUrl?: string
  caption?: string
  text?: string
  expiresAt?: Date
}

type CreateStoryResult =
  | { success: true; data: { storyId: string } }
  | { success: false; error: string }

/**
 * Creates a new story.
 * Stories can be text, image, video, or file based.
 *
 * @param params - Story details
 * @returns Success with story ID or error
 */
async function createStory(
  params: CreateStoryParams,
): Promise<CreateStoryResult> {
  const { id, userId, type, contentUrl, caption, text, expiresAt } = params
  const storyId = id || uuidv7()

  try {
    await db
      .insertInto('story')
      .values({
        id: storyId,
        user_id: userId,
        type,
        content_url: contentUrl ?? null,
        caption: caption ?? null,
        text: text ?? null,
        expires_at: expiresAt ?? null,
        updated_at: new Date(),
      })
      .execute()

    return { success: true, data: { storyId } }
  } catch (error) {
    console.error('Error creating story:', error)
    return { success: false, error: 'Failed to create story' }
  }
}

export { createStory }
export type { CreateStoryParams, CreateStoryResult }
