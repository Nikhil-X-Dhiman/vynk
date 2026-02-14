'use server';

/**
 * @fileoverview Authentication Server Actions
 *
 * Handles the complete authentication flow:
 * 1. Send OTP
 * 2. Verify OTP
 * 3. User check
 * 4. New User Creation
 * 5. Sign Out
 *
 * @module app/actions/login-auth
 */

'use server'

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

// ==========================================
// Constants
// ==========================================

const NETWORK_CHECK_TIMEOUT = 5000
const TWILIO_API_URL = 'https://api.twilio.com';

// ==========================================
// Types
// ==========================================

type OTPResult = { success: boolean; message: string };

type VerifyResult =
  | { success: true; isNewUser: boolean; user: unknown }
  | { success: false; message: string };

type CheckUserResult =
  | { success: true; user: unknown; session: unknown }
  | { success: false; message?: string; user?: null };

type NewUserResult =
  | { success: true; user: unknown }
  | { success: false; message?: string; user?: null };

// ==========================================
// Helpers
// ==========================================

function formatE164(countryCode: string, phoneNumber: string): string {
  const cleanCode = countryCode.replace('+', '');
  return `+${cleanCode}${phoneNumber}`;
}

async function verifyNetworkConnectivity(): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), NETWORK_CHECK_TIMEOUT);

  try {
    await fetch(TWILIO_API_URL, {
      method: 'HEAD',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

// ==========================================
// Actions
// ==========================================

export const sendOTPAction = publicDirectAction(
  async (formData: FormData): Promise<OTPResult> => {
    try {
      const countryCode = formData.get('countryCode')?.toString()
      const number = formData.get('phoneNumber')?.toString()?.trim()

      if (!countryCode || !number) {
        return {
          success: false,
          message: 'Phone number and country code are required',
        }
      }

      const phoneNumber = formatE164(countryCode, number)

      // Network pre-check
      try {
        await verifyNetworkConnectivity()
      } catch {
        return {
          success: false,
          message:
            'Unable to reach SMS service. Please check your internet connection.',
        }
      }

      await auth.api.sendPhoneNumberOTP({
        body: { phoneNumber },
      })

      return { success: true, message: 'OTP sent successfully' }
    } catch (error: unknown) {
      console.error('[Auth] OTP send failed:', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to send OTP. Please try again.';
      return { success: false, message };
    }
  },
);

export const verifyOTPAction = publicDirectAction(
  async (formData: FormData): Promise<VerifyResult> => {
    try {
      const phoneNumber = formData.get('phoneNumber')?.toString();
      const countryCode = formData.get('countryCode')?.toString();
      const code = formData.get('otp')?.toString();

      if (!phoneNumber || !countryCode || !code) {
        return {
          success: false,
          message: 'Phone number, country code, and OTP are required',
        };
      }

      const fullPhoneNumber = formatE164(countryCode, phoneNumber);

      const result = await auth.api.verifyPhoneNumber({
        body: { phoneNumber: fullPhoneNumber, code },
        headers: await headers(),
      });

      if (!result) {
        return { success: false, message: 'Invalid or expired OTP' };
      }

      const userResult = await findUserByPhone({
        phoneNumber,
        countryCode,
      });

      if (!userResult.success) {
        return {
          success: false,
          message: 'Failed to check user profile',
        };
      }

      return {
        success: true,
        isNewUser: !userResult.data,
        user: result.user,
      };
    } catch (error) {
      console.error('[Auth] OTP verification failed:', error);
      return {
        success: false,
        message: 'Verification failed. Please try again.',
      };
    }
  },
);

export const handleCheckUserAndSessionAction = publicDirectAction(
  async (formData: FormData): Promise<CheckUserResult> => {
    const { isAuth, session } = await checkServerAuth();

    if (!isAuth) {
      return { success: false, message: 'Not authenticated' };
    }

    const phoneNumber = formData.get('phoneNumber')?.toString();
    const countryCode = formData.get('countryCode')?.toString();

    if (!phoneNumber || !countryCode) {
      return {
        success: false,
        message: 'Phone number and country code are required',
      };
    }

    const userResult = await findUserByPhone({
      phoneNumber,
      countryCode,
    });

    if (!userResult.success) {
      return {
        success: false,
        message: 'Failed to check user profile',
      };
    }

    if (!userResult.data) {
      return { success: false, user: null };
    }

    return { success: true, user: userResult.data, session };
  },
);

// NOTE: This duplicates functionality in avatar-actions.ts but is kept for `AuthFlow` completeness.
// Ideally, `AuthFlow` should use `avatarActions` directly for profile creation.
export const handleNewUserAction = protectedAction(
  async (ctx: AuthContext, formData: FormData): Promise<NewUserResult> => {
    const phoneNumber = formData.get('phone')?.toString();
    const countryCode = formData.get('countryCode')?.toString();
    const username = formData.get('username')?.toString();
    const bio = formData.get('bio')?.toString();
    const avatarUrl = formData.get('avatarURL')?.toString();

    if (!phoneNumber || !countryCode || !username || !bio || !avatarUrl) {
      return { success: false, message: 'All profile fields are required' };
    }

    const result = await createNewUser({
      id: ctx.session.user.id,
      phoneNumber,
      countryCode,
      username,
      bio,
      avatarUrl,
    });

    if (!result.success) {
      return { success: false, message: result.error };
    }

    return { success: true, user: result.data };
  },
);

export const signOutAction = protectedAction(async () => {
  await auth.api.signOut({
    headers: await headers(),
  })
  redirect('/login')
})
