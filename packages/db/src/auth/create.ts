import { randomUUID } from 'crypto';
import { db } from '../../kysely/db';
import { findUserByPhone } from './get';
type CreateUser = {
  phoneNumber: string;
  countryCode: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
};

async function createNewUser(payload: CreateUser) {
  const { countryCode, phoneNumber, username, avatarUrl, bio } = payload;
  try {
    const result = await findUserByPhone({ phoneNumber, countryCode });
    if (!result) return { success: false, message: 'User Already Exists' };
    const newUser = await db
      .insertInto('user')
      .values({
        id: randomUUID, // Generating ID manually
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

    return { success: true, message: newUser };
  } catch (error) {
    console.error('Error creating user:', error);
    // Check for unique constraint violation (e.g., phone number already exists)
    if ((error as any).code === '23505') {
      return {
        success: false,
        message: 'User with this phone number already exists',
      };
    }
    throw new Error('Failed to create user');
  }
}

export { createNewUser };
