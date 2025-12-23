'use server';
import { auth } from '@/lib/auth/auth-server';
import { db } from '@repo/db';
import { headers } from 'next/headers';

async function avatarActions(
  prevState: {
    success: boolean;
    message: string;
  },
  formData: FormData,
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const avatarID = formData.get('avatarID')?.toString();
    const username = formData.get('username')?.toString();
    const consent =
      formData.get('consent')?.toString() === 'true' ? true : false;
    console.log(
      `Server Action for Avatar Username: ${avatarID} ${username} ${consent}`,
    );
    if (!username || !avatarID) {
      return { success: false, message: 'Server Action: Arguments are empty' };
    }
    if (consent === false) {
      return {
        success: false,
        message: 'Server Action: Consent is Negative(False)',
      };
    }

    if (!session?.user.phoneNumber) {
      return { success: false, message: 'No phone number in session' };
    }

    const existingUser = await db
      .selectFrom('user')
      .where('phone_number', '=', session?.user.phoneNumber)
      .select('id')
      .executeTakeFirst();

    if (existingUser) {
      await db
        .updateTable('user')
        .set({
          user_name: username,
          avatar_url: avatarID,
          updated_at: new Date(),
        })
        .where('phone_number', '=', session?.user.phoneNumber)
        .execute();
    } else {
      await db
        .insertInto('user')
        .values({
          id: crypto.randomUUID(),
          phone_number: session?.user.phoneNumber,
          avatar_url: avatarID,
          user_name: username,
          updated_at: new Date(),
        })
        .execute();
    }

    // await db
    //   .insertInto('user')
    //   .values({
    //     id: crypto.randomUUID(),
    //     phone_number: session?.user.phoneNumber,
    //     avatar_url: avatarID,
    //     user_name: username,
    //     updated_at: new Date(),
    //   })
    //   .onConflict((oc)=>oc.column('phone_number'))
    //   .doUpdateSet({
    //     user_name: username,
    //     avatar_url: avatarID,
    //     updated_at: new Date(),
    //   })
    //   .execute();

    return { success: true, message: 'Form Submitted' };
  } catch (error) {
    console.error(`Error Occured: ${error}`);

    return { success: false, message: 'Form Submitted' };
  }
}

export default avatarActions;
