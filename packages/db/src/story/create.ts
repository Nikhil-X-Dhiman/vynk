import { randomUUID } from 'crypto';
import { db } from '../../kysely/db';

import { Media } from '../../kysely/generated/types';

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
  type: Media;
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
        updated_at: new Date(),
      })
      .execute();
    return { success: true };
  } catch (error) {
    console.error('Error creating story:', error);
    return { success: false, error: 'Failed to create story' };
  }
}

export { createStory };
