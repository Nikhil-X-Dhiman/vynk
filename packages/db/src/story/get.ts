import { db } from '../../kysely/db';

/**
 * Returns all stories from the database joined with user information.
 */
export async function getAllStories() {
  return await db
    .selectFrom('story as s')
    .innerJoin('user as u', 's.user_id', 'u.id')
    .select([
      's.id',
      's.type',
      's.content_url',
      's.caption',
      's.text',
      's.user_id',
      's.expires_at',
      's.created_at',
      'u.user_name',
      'u.avatar_url',
    ])
    .orderBy('s.created_at', 'desc')
    .execute();
}

/**
 * Returns the list of users who viewed a specific story, including their details and any reactions.
 */
export async function getStoryViewers(storyId: string) {
  return await db
    .selectFrom('story_view as sv')
    .innerJoin('user as u', 'sv.user_id', 'u.id')
    .select([
      'u.id as user_id',
      'u.user_name as name',
      'u.avatar_url as avatar',
      'sv.reaction',
      'sv.viewed_at',
    ])
    .where('sv.story_id', '=', storyId)
    .orderBy('sv.viewed_at', 'desc')
    .execute();
}
// TODO 1:  here, count of viewers by checking the length of the returned array.
// TODO 2:  here, count of reactions by checking the length of the returned array.
