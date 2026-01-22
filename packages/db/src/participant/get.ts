import { db } from '../../kysely/db';

async function getConversationParticipants(conversationId: string) {
  try {
    const participants = await db
      .selectFrom('participant')
      .select(['user_id as userId'])
      .where('conversation_id', '=', conversationId)
      .execute();

    return { success: true, data: participants };
  } catch (error) {
    console.error('Error fetching conversation participants:', error);
    return { success: false, error: 'Failed to fetch participants' };
  }
}

async function getUserJoinedGroups(userId: string) {
  try {
    const groups = await db
      .selectFrom('participant')
      .innerJoin('conversation', 'conversation.id', 'participant.conversation_id')
      .select(['conversation.id', 'conversation.type'])
      .where('participant.user_id', '=', userId)
      .where('conversation.type', 'in', ['group', 'broadcast'])
      .execute();

    return { success: true, data: groups };
  } catch (error) {
    console.error('Error fetching joined groups:', error);
    return { success: false, error: 'Failed to fetch joined groups' };
  }
}

export { getConversationParticipants, getUserJoinedGroups };
