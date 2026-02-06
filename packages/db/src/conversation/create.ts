import { randomUUID } from 'crypto';
import { db } from '../../kysely/db';

type CreateConversationParams = {
  type: 'private' | 'group' | 'broadcast';
  title: string;
  createdByUserId: string;
  groupImg?: string;
  groupDesc?: string;
  participantInfo: { userId: string; role: 'member' | 'admin' }[];
};

type CreateConversationResult =
  | { success: true; data: string }
  | { success: false; error: string };

/**
 * Creates a new conversation with participants in a single transaction.
 * Uses UUIDs for both conversation and participant records.
 *
 * @param params - Conversation details and participant information
 * @returns Success with conversation ID or error message
 */
async function createConversation({
  type,
  title,
  createdByUserId,
  groupImg,
  groupDesc,
  participantInfo,
}: CreateConversationParams): Promise<CreateConversationResult> {
  // TODO: Consider using UUIDv7 for time-sortable IDs
  const conversationId = randomUUID();

  try {
    await db.transaction().execute(async (trx) => {
      await trx
        .insertInto('conversation')
        .values({
          id: conversationId,
          type,
          title,
          created_by: createdByUserId,
          group_img: groupImg ?? null,
          group_bio: groupDesc ?? null,
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
            updated_at: new Date(),
          })),
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
export type { CreateConversationParams, CreateConversationResult };
