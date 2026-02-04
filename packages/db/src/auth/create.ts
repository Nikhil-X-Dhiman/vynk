import { db } from '../../kysely/db';
import { findUserByPhone } from './get';

/**
 * Payload for creating a new user in the app database.
 * The `id` MUST match the user ID from Better Auth session to maintain
 * referential integrity across databases.
 */
type CreateUser = {
  /** User ID from Better Auth session - ensures FK constraints work */
  id: string;
  phoneNumber: string;
  countryCode: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
};

/**
 * Creates a new user in the app database (vynk_data).
 *
 * @important The `id` parameter must be the same as the auth session user ID.
 * This ensures that when operations like `startConversation` use `session.user.id`,
 * the FK constraint on `conversation.created_by` will find a matching user.
 *
 * @param payload - User data including auth session ID
 * @returns Success with user data or error
 */
async function createNewUser(payload: CreateUser) {
  const { id, countryCode, phoneNumber, username, avatarUrl, bio } = payload;
  try {
    const existingUser = await findUserByPhone({ phoneNumber, countryCode });
    if (existingUser.success && existingUser.data) {
      return { success: false, error: 'User Already Exists' };
    }

    const newUser = await db
      .insertInto('user')
      .values({
        id: id, // Use auth session ID for FK consistency
        phone_number: phoneNumber,
        country_code: countryCode,
        user_name: username,
        // Optional fields with defaults or nulls
        bio: bio || 'Hi There, I am using Vynk',
        avatar_url: avatarUrl || 'avatar/3d_4.png',
        is_verified: true,
        re_consent: false,
        updated_at: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return { success: true, data: newUser };
  } catch (error) {
    console.error('Error creating user:', error);
    // Check for unique constraint violation (e.g., phone number already exists)
    if ((error as any).code === '23505') {
      return {
        success: false,
        error: 'User with this phone number already exists',
      };
    }
    return { success: false, error: 'Failed to create user' };
  }
}

export { createNewUser };
