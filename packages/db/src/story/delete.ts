import { db } from '../../kysely/db';

type DeleteStoryResult =
  | { success: true; data: { deleted: boolean } }
  | { success: false; error: string };

/**
 * Soft-deletes a story by setting is_deleted to true.
 *
 * @param storyId - The story ID to delete
 * @param userId - The user ID (for authorization check)
 * @returns Success with deletion status or error
 */
async function deleteStory(
  storyId: string,
  userId: string
): Promise<DeleteStoryResult> {
  try {
    const result = await db
      .updateTable('story')
      .set({
        is_deleted: true,
        updated_at: new Date(),
      })
      .where('id', '=', storyId)
      .where('user_id', '=', userId)
      .where('is_deleted', '=', false)
      .executeTakeFirst();

    return {
      success: true,
      data: { deleted: Number(result.numUpdatedRows) > 0 },
    };
  } catch (error) {
    console.error('Error deleting story:', error);
    return { success: false, error: 'Failed to delete story' };
  }
}

export { deleteStory };
export type { DeleteStoryResult };
