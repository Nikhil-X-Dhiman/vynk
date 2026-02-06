import { db } from '../../kysely/db';
import type { User } from './create';

type FindUserByPhoneParams = {
  phoneNumber: string;
  countryCode: string;
};

type FindUserByPhoneResult =
  | { success: true; data: User }
  | { success: true; data: null }
  | { success: false; error: string };

/**
 * Finds a user by their phone number and country code.
 * Uses the unique constraint on (phone_number, country_code).
 *
 * @param params - Phone number and country code to search
 * @returns User data if found, null if not found, or error
 */
async function findUserByPhone(
  params: FindUserByPhoneParams,
): Promise<FindUserByPhoneResult> {
  const { phoneNumber, countryCode } = params;

  try {
    const user = await db
      .selectFrom('user')
      .select([
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
      .where('phone_number', '=', phoneNumber)
      .where('country_code', '=', countryCode)
      .executeTakeFirst();

    if (!user) {
      return { success: true, data: null };
    }

    return { success: true, data: user as User };
  } catch (error) {
    console.error('Error finding user by phone:', error);
    return { success: false, error: 'Failed to find user' };
  }
}

/**
 * Finds a user by their ID.
 *
 * @param userId - The user ID to search
 * @returns User data if found, null if not found, or error
 */
async function findUserById(userId: string): Promise<FindUserByPhoneResult> {
  try {
    const user = await db
      .selectFrom('user')
      .select([
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
      .where('id', '=', userId)
      .executeTakeFirst();

    if (!user) {
      return { success: true, data: null };
    }

    return { success: true, data: user as User };
  } catch (error) {
    console.error('Error finding user by ID:', error);
    return { success: false, error: 'Failed to find user' };
  }
}

export { findUserByPhone, findUserById };
export type { FindUserByPhoneParams, FindUserByPhoneResult };
