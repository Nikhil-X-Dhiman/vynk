import { db } from '../../kysely/db';

/**
 * Get all group conversations that a user is a participant of.
 * Used by socket server to auto-join users to their group rooms on connection.
 *
 * @param userId - The user ID to look up groups for
 * @returns List of group conversation IDs
 */
async function getUserJoinedGroups(userId: string) {
  try {
    const groups = await db
      .selectFrom('participant')
      .innerJoin('conversation', 'conversation.id', 'participant.conversation_id')
      .select(['conversation.id'])
      .where('participant.user_id', '=', userId)
      .where('conversation.type', '=', 'group')
      .where('conversation.is_deleted', '=', false)
      .execute();

    return { success: true, data: groups };
  } catch (error) {
    console.error('Error fetching user joined groups:', error);
    return { success: false, error: 'Failed to fetch groups' };
  }
}

export { getUserJoinedGroups };
