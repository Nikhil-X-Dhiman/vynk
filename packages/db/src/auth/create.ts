import { db } from '../../kysely/db';

/**
 * Payload for creating a new user in the app database.
 * The `id` MUST match the user ID from Better Auth session to maintain
 * referential integrity across databases.
 */
type CreateUserParams = {
  /** User ID from Better Auth session - ensures FK constraints work */
  id: string;
  phoneNumber: string;
  countryCode: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
};

type User = {
  id: string;
  phone_number: string;
  country_code: string;
  user_name: string;
  bio: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  re_consent: boolean;
  created_at: Date;
  updated_at: Date;
};

type CreateUserResult =
  | { success: true; data: User }
  | { success: false; error: string };

/**
 * Creates a new user in the app database (vynk_data).
 *
 * Uses `ON CONFLICT (phone_number) DO NOTHING` to atomically handle duplicate phone numbers,
 * eliminating race conditions and extra SELECT queries.
 *
 * @important The `id` parameter must be the same as the auth session user ID.
 * This ensures that when operations like `startConversation` use `session.user.id`,
 * the FK constraint on `conversation.created_by` will find a matching user.
 *
 * @param params - User data including auth session ID
 * @returns Success with user data or error if user already exists
 */
async function createNewUser(
  params: CreateUserParams,
): Promise<CreateUserResult> {
  const { id, countryCode, phoneNumber, username, avatarUrl, bio } = params;

  try {
    const result = await db
      .insertInto('user')
      .values({
        id,
        phone_number: phoneNumber,
        country_code: countryCode,
        user_name: username,
        bio: bio ?? 'Hi There, I am using Vynk',
        avatar_url: avatarUrl ?? 'avatar/3d_4.png',
        is_verified: true,
        re_consent: false,
        updated_at: new Date(),
      })
      .onConflict((oc) => oc.column('phone_number').doNothing())
      .returning([
        'id',
        'phone_number',
        'country_code',
        'user_name',
        'bio',
        'avatar_url',
        'is_verified',
        're_consent',
        'created_at',
        'updated_at',
      ])
      .executeTakeFirst()

    // If result is undefined, the insert was skipped due to conflict
    if (!result) {
      return { success: false, error: 'User Already Exists' };
    }

    return { success: true, data: result as User };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: 'Failed to create user' };
  }
}

export { createNewUser };
export type { CreateUserParams, CreateUserResult, User };
