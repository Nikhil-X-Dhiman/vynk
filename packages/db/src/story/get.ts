import { db } from '../../kysely/db';

/**
 * Returns stories from the database for a specific user and their friends.
 */
export async function getFriendsStories(userId: string) {
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
    .where((eb) =>
      eb.or([
        // User's own stories
        eb('s.user_id', '=', userId),
        // Stories from users who accepted the current user's friend request
        eb('s.user_id', 'in', (subeb: any) =>
          subeb
            .selectFrom('friendship')
            .select('friend_id')
            .where('user_id', '=', userId)
            .where('status', '=', 'ACCEPTED')
        ),
        // Stories from users whose friend request the current user accepted
        eb('s.user_id', 'in', (subeb: any) =>
          subeb
            .selectFrom('friendship')
            .select('user_id')
            .where('friend_id', '=', userId)
            .where('status', '=', 'ACCEPTED')
        ),
      ])
    )
    .where((eb) =>
      eb.or([
        eb('s.expires_at', '>', new Date()),
        eb('s.expires_at', 'is', null),
      ])
    )
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
