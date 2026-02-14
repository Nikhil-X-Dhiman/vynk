import { v7 as uuidv7 } from 'uuid';
import { db } from '../../kysely/db';

type AddReactionParams = {
  id?: string;
  messageId?: string;
  storyId?: string;
  userId: string;
  emoji: string;
};

type AddReactionResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Adds a reaction to a message or story.
 * Use ON CONFLICT to update emoji if user already reacted.
 *
 * @param params - Reaction details
 * @returns Success or error
 */
async function addReaction(params: AddReactionParams): Promise<AddReactionResult> {
  const { id, messageId, storyId, userId, emoji } = params;

  if (!messageId && !storyId) {
    return { success: false, error: 'Either messageId or storyId must be provided' };
  }

  try {
    await db
      .insertInto('reaction')
      .values({
        id: id || uuidv7(),
        message_id: messageId || null,
        story_id: storyId || null,
        user_id: userId,
        emoji,
        created_at: new Date(),
      })
      .onConflict((oc) => {
        if (messageId) {
          return oc.columns(['message_id', 'user_id']).doUpdateSet({ emoji });
        } else {
          return oc.columns(['story_id', 'user_id']).doUpdateSet({ emoji });
        }
      })
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Error adding reaction:', error);
    return { success: false, error: 'Failed to add reaction' };
  }
}

type RemoveReactionParams = {
  messageId?: string;
  storyId?: string;
  userId: string;
};

type RemoveReactionResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Removes a reaction from a message or story.
 *
 * @param params - Reaction identifying details
 * @returns Success or error
 */
async function removeReaction(params: RemoveReactionParams): Promise<RemoveReactionResult> {
  const { messageId, storyId, userId } = params;

  try {
    let query = db.deleteFrom('reaction').where('user_id', '=', userId);

    if (messageId) {
      query = query.where('message_id', '=', messageId);
    } else if (storyId) {
      query = query.where('story_id', '=', storyId);
    } else {
      return { success: false, error: 'Either messageId or storyId must be provided' };
    }

    await query.execute();
    return { success: true };
  } catch (error) {
    console.error('Error removing reaction:', error);
    return { success: false, error: 'Failed to remove reaction' };
  }
}

export { addReaction, removeReaction };
export type { AddReactionParams, AddReactionResult, RemoveReactionParams, RemoveReactionResult };
