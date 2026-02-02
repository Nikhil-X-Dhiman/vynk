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

export const sendOTPAction = publicDirectAction(async (formData: FormData) => {
  try {
    const countryCode = formData.get('countryCode')?.toString();
    const number = formData.get('phoneNumber')?.toString().trim();

    if (!countryCode || !number) {
      return { success: false, message: 'Phone number data is missing' };
    }

    const phoneNumber = `+${countryCode.replace('+', '')}${number}`;

    // 1. Network Pre-Check: Verify Twilio API is reachable
    // This catches network issues BEFORE Better Auth's background task fires
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      await fetch('https://api.twilio.com', {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
    } catch (networkError) {
      console.error('Network Pre-Check Failed:', networkError);
      return {
        success: false,
        message:
          'Unable to reach SMS service. Please check your internet connection.',
      };
    }

    // 2. Call Better-Auth API (network is confirmed available)
    await auth.api.sendPhoneNumberOTP({
      body: {
        phoneNumber,
      },
    });

    return { success: true, message: 'OTP Sent Successfully' };
  } catch (error: unknown) {
    console.error('OTP Send Error:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to send OTP. Please check your connection.';
    return { success: false, message };
  }
});

export const verifyOTPAction = publicDirectAction(async (formData: FormData) => {
  try {
    const phoneNumber = formData.get('phoneNumber')?.toString();
    const countryCode = formData.get('countryCode')?.toString();
    const code = formData.get('otp')?.toString();

    if (!phoneNumber || !countryCode || !code) {
      return { success: false, message: 'Missing phone or otp' };
    }

    // countryCode already has '+' prefix from the store, so we strip it here
    const cleanCountryCode = countryCode.replace('+', '');
    const fullPhoneNumber = `+${cleanCountryCode}${phoneNumber}`;

    // 1. Verify OTP using the server-side internal API
    // This allows us to get the session immediately without cookie delays
    const result = await auth.api.verifyPhoneNumber({
      body: {
        phoneNumber: fullPhoneNumber,
        code,
      },
      headers: await headers(), // This ensures the session cookie is set in the response
    });

    if (!result) return { success: false, message: 'Verification failed' };

    // 2. Check if user exists in our app database (Profile check)
    const { data: existingUser } = await findUserByPhone({
      phoneNumber,
      countryCode,
    });

    // If user exists in DB, they are not new. Otherwise, they need onboarding.
    const isNewUser = !existingUser;

    return {
      success: true,
      isNewUser,
      user: result.user,
    };
  } catch (error) {
    console.error('Verification Error:', error);
    return {
      success: false,
      message: error || 'Error during verification',
    };
  }
});

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
