import { db } from '../../kysely/db';
import { randomUUID } from 'crypto';

async function createConversation({
  type,
  title,
  createdByUserId,
  groupImg,
  groupDesc,
  participantInfo,
}: {
  type: 'private' | 'group' | 'broadcast';
  title: string;
  createdByUserId: string;
  groupImg: string;
  groupDesc: string;
  participantInfo: { userId: string; role: 'member' | 'admin' }[];
}) {
  const conversationId = randomUUID();
  try {
    await db.transaction().execute(async (trx) => {
      const result = await trx
        .insertInto('conversation')
        .values({
          id: conversationId,
          type,
          title,
          created_by: createdByUserId,
          group_img: groupImg,
          group_bio: groupDesc,
          updated_at: new Date(),
        })
        .execute();
      await trx
        .insertInto('participant')
        .values(
          participantInfo.map((participant) => ({
            id: randomUUID(),
            conversation_id: conversationId,
            user_id: participant.userId,
            role: participant.role,
          }))
        )
        .execute();
    });
    return { success: true, data: conversationId };
  } catch (error) {
    console.error('Error creating conversation:', error);
    return { success: false, error: 'Failed to create conversation' };
  }
}

export { createConversation };
