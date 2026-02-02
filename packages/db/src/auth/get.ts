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
      .executeTakeFirst();

    if (!user) {
      return { success: false, data: null };
    }

    return { success: true, data: user };
  } catch (error) {
    console.error('Error finding user:', error);
    return { success: false, error: 'Database query failed' };
  }
}

export { findUserByPhone };
