import { randomUUID } from 'crypto';
import { db } from '../../kysely/db';

function createStory({
  userId,
  contentUrl,
  caption,
  expiresAt,
}: {
  userId: string;
  contentUrl?: string;
  caption?: string;
  expiresAt?: Date;
}) {
  return db
    .insertInto('story')
    .values({
      id: randomUUID(),
      user_id: userId,
      content_url: contentUrl,
      caption,
      expires_at: expiresAt,
    })
    .execute();
}

export { createStory };
