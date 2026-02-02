'use server';

import { auth } from '@/lib/auth/auth-server';
import { createNewUser, findUserByPhone } from '@repo/db';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  protectedAction,
  publicDirectAction,
  type AuthContext,
} from '@/lib/safe-action';
import { checkServerAuth } from '@/lib/auth/check-server-auth';

// const sendOTPAction = publicAction(
//   async (
//     prevState: {
//       success: boolean;
//       message: string;
//     },
//     formData: FormData,
//   ) => {
//     try {
//       const countryCode = formData.get('countryCode')?.toString();
//       const number = formData.get('phoneNumber')?.toString().trim();
//       const phoneNumber = `+${countryCode}${number}`;
//       // Validating Phone Number
//       const { success, error } =
//         loginSchema.shape.phoneNumber.safeParse(phoneNumber);
//       if (!success) return { success: false, message: error.issues[0].message };
//       // {assing Phone Number to Send OTP
//       await auth.api.sendPhoneNumberOTP({
//         body: {
//           phoneNumber,
//         },
//       });

//       return { success: true, message: 'Done' };
//     } catch (error) {
//       console.error('Verification Error:', error);
//       return { success: false, message: `Error during verification: ${error}` };
//     }
//   },
// );

// const verifyOTPAction = publicDirectAction(async (formData: FormData) => {
//   try {
//     const phoneNumber = formData.get('phoneNumber')?.toString();
//     const countryCode = formData.get('countryCode')?.toString();
//     const code = formData.get('otp')?.toString();

//     if (!phoneNumber || !countryCode || !code) {
//       return { success: false, message: 'Missing phone or otp' };
//     }

//     const fullPhoneNumber = `+${countryCode}${phoneNumber}`;

//     // 1. Verify OTP on the server
//     const result = await auth.api.verifyPhoneNumber({
//       body: {
//         phoneNumber: fullPhoneNumber,
//         code,
//       },
//       headers: await headers(), // Crucial for setting cookies
//     });

//     if (!result) return { success: false, message: 'Verification failed' };

//     // 2. Check if user has a profile (username set)
//     // The user record is already in result.user
//     const isNewUser = !result.user.name || result.user.name === fullPhoneNumber;

//     return {
//       success: true,
//       isNewUser,
//       user: result.user,
//       session: result.session,
//     };
//   } catch (error: any) {
//     console.error('Verification Error:', error);
//     return {
//       success: false,
//       message: error.message || 'Error during verification',
//     };
//   }
// });

export const handleCheckUserAndSessionAction = publicDirectAction(
  async (formData: FormData) => {
    const { isAuth, session } = await checkServerAuth();
    if (!isAuth) {
      return { success: false, message: 'User is not authenticated' };
    }
    const phoneNumber = formData.get('phoneNumber')?.toString();
    const countryCode = formData.get('countryCode')?.toString();
    if (!phoneNumber || !countryCode)
      return { success: false, message: 'GetUser: Data is missing' };

    // call db to check user exists
    const { data: existingUser } = await findUserByPhone({
      phoneNumber,
      countryCode,
    });
    if (!existingUser) return { success: false, user: null };

    return { success: true, user: existingUser, session };
  },
);

const handleNewUserAction = protectedAction(
  async (ctx: AuthContext, formData: FormData) => {
    // phonenumber, countrycode, username, bio, avatarurl
    const { isAuth } = await checkServerAuth();
    if (!isAuth) {
      return { success: false, message: 'User is not authenticated' };
    }
    const phoneNumber = formData.get('phone')?.toString();
    const countryCode = formData.get('countryCode')?.toString();
    const username = formData.get('username')?.toString();
    const bio = formData.get('bio')?.toString();
    const avatarUrl = formData.get('avatarURL')?.toString();
    if (!phoneNumber || !countryCode || !username || !bio || !avatarUrl)
      return { success: false, message: 'NewUser: Data is missing' };

    const newUser = await createNewUser({
      phoneNumber,
      countryCode,
      username,
      bio,
      avatarUrl,
    });
    if (!newUser) return { success: false, user: null };
    return { success: true, user: newUser };
  },
);

const signOutAction = protectedAction(async () => {
  await auth.api.signOut({
    headers: await headers(),
  });
  redirect('/login');
});

export {
  // sendOTPAction,
  // verifyOTPAction,
  handleNewUserAction,
  signOutAction,
};
