'use server';

import { auth } from '@/lib/auth/auth-server';
import { loginSchema } from '@repo/validation';
import { createNewUser, findUserByPhone } from '@repo/db';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { StringFormatParams, success } from 'better-auth';
import { publicAction, protectedAction, publicDirectAction, type AuthContext } from '@/lib/safe-action';

const sendOTPAction = publicAction(async (
  prevState: {
    success: boolean;
    message: string;
  },
  formData: FormData
) => {
  try {
    const countryCode = formData.get('countryCode')?.toString();
    const number = formData.get('phoneNumber')?.toString().trim();
    const phoneNumber = `+${countryCode}${number}`;
    // Validating Phone Number
    const { success, error } =
      loginSchema.shape.phoneNumber.safeParse(phoneNumber);
    if (!success) return { success: false, message: error.issues[0].message };
    // {assing Phone Number to Send OTP
    await auth.api.sendPhoneNumberOTP({
      body: {
        phoneNumber,
      },
    });

    return { success: true, message: 'Done' };
  } catch (error) {
    console.error('Verification Error:', error);
    return { success: false, message: `Error during verification: ${error}` };
  }
});

const verifyOTPAction = publicAction(async (
  prevState: { success: boolean; message: string },
  formData: FormData
) => {
  try {
    let phoneNumber = formData.get('phoneNumber')?.toString();
    phoneNumber = `+${phoneNumber}`;
    const code = formData.get('otp')?.toString();
    if (!phoneNumber || !code) {
      return { success: false, message: 'Missing phone or otp' };
    }
    console.log(
      `OTP Server Action -> Verify OTP: ${phoneNumber} with OTP: ${code}`
    );
    await auth.api.verifyPhoneNumber({
      body: {
        phoneNumber,
        code,
      },
    });
    return { success: true, message: 'Done' };
  } catch (error) {
    console.error('Verification Error:', error);
    return { success: false, message: 'Error during verification' };
  }
});

const handleGetUserAction = publicDirectAction(async (formData: FormData) => {
  const phoneNumber = formData.get('phoneNumber')?.toString();
  const countryCode = formData.get('countryCode')?.toString();
  if (!phoneNumber || !countryCode)
    return { success: false, message: 'GetUser: Data is missing' };

  // call db to check user exists
  const existingUser = await findUserByPhone({
    phoneNumber,
    countryCode,
  });
  if (!existingUser) return { success: false, user: null };

  return { success: true, user: existingUser };
});

const handleNewUserAction = protectedAction(async (ctx: AuthContext, formData: FormData) => {
  // phonenumber, countrycode, username, bio, avatarurl
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
  if (newUser) return { success: false, user: null };
  return { success: true, user: newUser };
});

const signOutAction = protectedAction(async () => {
  await auth.api.signOut({
    headers: await headers(),
  });
  redirect('/login');
});

export {
  sendOTPAction,
  verifyOTPAction,
  handleGetUserAction,
  handleNewUserAction,
  signOutAction,
};
