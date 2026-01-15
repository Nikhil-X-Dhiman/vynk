import { randomUUID } from 'crypto';
import { db } from '../../kysely/db';
type CreateUser = {
  phoneNumber: string;
  countryCode: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
};

async function createNewUser(payload: CreateUser) {
  try {
    const newUser = await db
      .insertInto('user')
      .values({
        id: randomUUID, // Generating ID manually
        phone_number: payload.phoneNumber,
        country_code: payload.countryCode,
        user_name: payload.username,
        // Optional fields with defaults or nulls
        bio: payload.bio || 'Hi There, I am using Vynk',
        avatar_url: payload.avatarUrl || 'avatar/3d_4.png',
        is_verified: true,
        re_consent: false,
        updated_at: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return newUser;
  } catch (error) {
    console.error('Error creating user:', error);
    // Check for unique constraint violation (e.g., phone number already exists)
    if ((error as any).code === '23505') {
      return { error: 'User with this phone number already exists' };
    }
    throw new Error('Failed to create user');
  }
}

export { createNewUser };
