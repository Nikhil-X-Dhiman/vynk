'use server';
import { auth } from '@/lib/auth/auth-server';
import { createNewUser } from '@repo/db';
import { headers } from 'next/headers';

async function avatarActions(
  prevState: {
    success: boolean;
    message: string | Record<string, unknown>;
  },
  formData: FormData,
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user.phoneNumberVerified)
      return { success: false, message: 'Phone Number Not Verified!!!' };
    const profileUrl = formData.get('avatarUrl')?.toString();
    const username = formData.get('username')?.toString();
    const phoneNumber = formData.get('phoneNumber')?.toString();
    const countryCode = formData.get('countryCode')?.toString();
    const bio = formData.get('bio')?.toString();
    const consent =
      formData.get('consent')?.toString() === 'true' ? true : false;
    console.log(
      `Server Action for Avatar Username: ${profileUrl} ${username} ${consent}`,
    );
    if (!username || !profileUrl || !phoneNumber || !countryCode || !bio) {
      return { success: false, message: 'Server Action: Arguments are empty' };
    }
    if (consent === false) {
      return {
        success: false,
        message: 'Server Action: Consent is Negative(False)',
      };
    }

    const payload = {
      phoneNumber: phoneNumber,
      countryCode: countryCode,
      username,
      bio,
      avatarUrl: profileUrl,
    };

    const result = await createNewUser(payload);

    if (!result.success) {
      console.error('User creation failed:', result.message);
      return { success: false, message: result.message };
    }

    console.log(`New User Created: ${result.message}`);

    return { success: true, message: 'Form Submitted' };
  } catch (error) {
    console.error(`Error Occured: ${error}`);

    return { success: false, message: 'Form Submitted' };
  }
}


export { avatarActions };
