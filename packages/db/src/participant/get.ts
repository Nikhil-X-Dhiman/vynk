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

export { getConversationParticipants };
