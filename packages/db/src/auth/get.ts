import { db } from '../../kysely/db';

async function findUserByPhone({
  phoneNumber,
  countryCode,
}: {
  phoneNumber: string;
  countryCode: string;
}) {
  try {
    const user = await db
      .selectFrom('user')
      .selectAll()
      .where('phone_number', '=', phoneNumber)
      .where('country_code', '=', countryCode)
      .executeTakeFirstOrThrow();

    if (!user) {
      return false;
    }

    return user;
  } catch (error) {
    console.error('Error finding user:', error);
    throw new Error('Database query failed');
  }
}

export { findUserByPhone };
