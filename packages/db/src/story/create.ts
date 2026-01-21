import { randomUUID } from 'crypto';
import { db } from '../../kysely/db';

async function createStory({
  userId,
  contentUrl,
  caption,
  expiresAt,
  type,
  text,
}: {
  userId: string;
  contentUrl?: string;
  caption?: string;
  expiresAt?: Date;
  type: string;
  text?: string;
}) {
  try {
    await db
      .insertInto('story')
      .values({
        id: randomUUID(),
        type,
        content_url: contentUrl,
        user_id: userId,
        caption,
        text,
        expires_at: expiresAt,
        created_at: new Date(),
      })
      .execute();
    return { success: true };
  } catch (error) {
    console.error('Error creating story:', error);
    return { success: false, error: 'Failed to create story' };
  }
}

export { createStory };
