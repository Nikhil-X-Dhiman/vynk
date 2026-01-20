'use server';
import { auth } from '@/lib/auth/auth-server';
import { createNewUser } from '@repo/db';
import { authenticatedAction, type ActionState } from '@/lib/safe-action';

const avatarActions = authenticatedAction(async (
  ctx,
  prevState: ActionState,
  formData: FormData,
) => {
  console.log('Form Action Begins');
  const session = ctx.session;

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
  console.log('Form Action Passed Checks');

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
});


export { avatarActions };
