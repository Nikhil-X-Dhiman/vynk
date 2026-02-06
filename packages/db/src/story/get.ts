import { db } from '../../kysely/db';

type Story = {
  id: string;
  type: string | null;
  content_url: string | null;
  caption: string | null;
  text: string | null;
  user_id: string;
  expires_at: Date | null;
  created_at: Date;
  user_name: string;
  avatar_url: string | null;
};

type GetFriendsStoriesResult =
  | { success: true; data: Story[] }
  | { success: false; error: string };

/**
 * Gets stories from the user and their friends.
 * Only returns non-expired, non-deleted stories.
 *
 * @param userId - The current user ID
 * @returns List of stories with user info
 */
async function getFriendsStories(
  userId: string,
): Promise<GetFriendsStoriesResult> {
  try {
    const stories = await db
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
      .where('s.is_deleted', '=', false)
      .where((eb) =>
        eb.or([
          // User's own stories
          eb('s.user_id', '=', userId),
          // Stories from accepted friends (user sent request)
          eb('s.user_id', 'in', (subeb) =>
            subeb
              .selectFrom('friendship')
              .select('friend_id')
              .where('user_id', '=', userId)
              .where('status', '=', 'ACCEPTED'),
          ),
          // Stories from accepted friends (user received request)
          eb('s.user_id', 'in', (subeb) =>
            subeb
              .selectFrom('friendship')
              .select('user_id')
              .where('friend_id', '=', userId)
              .where('status', '=', 'ACCEPTED'),
          ),
        ]),
      )
      .where((eb) =>
        eb.or([
          eb('s.expires_at', '>', new Date()),
          eb('s.expires_at', 'is', null),
        ]),
      )
      .orderBy('s.created_at', 'desc')
      .execute();

    return { success: true, data: stories as Story[] };
  } catch (error) {
    console.error('Error fetching stories:', error);
    return { success: false, error: 'Failed to fetch stories' };
  }
}

type StoryViewer = {
  user_id: string;
  name: string;
  avatar: string | null;
  reaction: string | null;
  viewed_at: Date;
};

type GetStoryViewersResult =
  | { success: true; data: StoryViewer[] }
  | { success: false; error: string };

/**
 * Gets all viewers of a story with their reactions.
 *
 * @param storyId - The story ID
 * @returns List of viewers with reactions
 */
async function getStoryViewers(
  storyId: string,
): Promise<GetStoryViewersResult> {
  try {
    const viewers = await db
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

    return { success: true, data: viewers as StoryViewer[] };
  } catch (error) {
    console.error('Error fetching story viewers:', error);
    return { success: false, error: 'Failed to fetch viewers' };
  }
}

type GetStoryViewCountResult =
  | { success: true; data: number }
  | { success: false; error: string };

/**
 * Gets the view count for a story.
 *
 * @param storyId - The story ID
 * @returns View count
 */
async function getStoryViewCount(
  storyId: string,
): Promise<GetStoryViewCountResult> {
  try {
    const result = await db
      .selectFrom('story_view')
      .select((eb) => eb.fn.count('id').as('count'))
      .where('story_id', '=', storyId)
      .executeTakeFirst();

    return { success: true, data: Number(result?.count ?? 0) };
  } catch (error) {
    console.error('Error fetching story view count:', error);
    return { success: false, error: 'Failed to fetch view count' };
  }
}

export { getFriendsStories, getStoryViewers, getStoryViewCount };
export type {
  Story,
  GetFriendsStoriesResult,
  StoryViewer,
  GetStoryViewersResult,
  GetStoryViewCountResult,
};
