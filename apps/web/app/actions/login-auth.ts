'use server';

/**
 * @fileoverview Authentication Server Actions
 *
 * Handles the complete authentication flow:
 * 1. Send OTP to phone number
 * 2. Verify OTP and create session
 * 3. Check if user exists in app database
 * 4. Create new user profile (onboarding)
 * 5. Sign out
 *
 * @module app/actions/login-auth
 *
 * @example
 * ```ts
 * // Step 1: Send OTP
 * const otpResult = await sendOTPAction(formData);
 *
 * // Step 2: Verify OTP
 * const verifyResult = await verifyOTPAction(formData);
 *
 * // Step 3: Check user profile
 * const checkResult = await handleCheckUserAndSessionAction(formData);
 *
 * // Sign out
 * await signOutAction();
 * ```
 */

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

/**
 * Twilio API pre-check timeout in milliseconds.
 */
const NETWORK_CHECK_TIMEOUT = 5000;

/**
 * Twilio API base URL for network pre-check.
 */
const TWILIO_API_URL = 'https://api.twilio.com';

// ==========================================
// Types
// ==========================================

/** Result for OTP send action */
type OTPResult = { success: boolean; message: string };

/** Result for OTP verification action */
type VerifyResult =
  | { success: true; isNewUser: boolean; user: unknown }
  | { success: false; message: string };

/** Result for user/session check action */
type CheckUserResult =
  | { success: true; user: unknown; session: unknown }
  | { success: false; message?: string; user?: null };

/** Result for new user creation action */
type NewUserResult =
  | { success: true; user: unknown }
  | { success: false; message?: string; user?: null };

// ==========================================
// Helpers
// ==========================================

/**
 * Formats a phone number with country code into E.164 format.
 *
 * @param countryCode - Country code (with or without '+' prefix)
 * @param phoneNumber - Local phone number
 * @returns E.164 formatted phone number (e.g., '+14155552671')
 */
function formatE164(countryCode: string, phoneNumber: string): string {
  const cleanCode = countryCode.replace('+', '');
  return `+${cleanCode}${phoneNumber}`;
}

/**
 * Verifies that the Twilio API is reachable before attempting to send SMS.
 * Prevents unnecessary Better Auth calls when network is unavailable.
 *
 * @throws Error if network is unreachable
 */
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
// OTP Actions
// ==========================================

/**
 * Sends an OTP to the provided phone number.
 *
 * Flow:
 * 1. Validates phone number and country code
 * 2. Performs network pre-check against Twilio API
 * 3. Sends OTP via Better Auth phone number plugin
 *
 * @param formData - Must contain 'countryCode' and 'phoneNumber'
 * @returns Success/failure with message
 */
export const sendOTPAction = publicDirectAction(
  async (formData: FormData): Promise<OTPResult> => {
    try {
      const countryCode = formData.get('countryCode')?.toString();
      const number = formData.get('phoneNumber')?.toString()?.trim();

      if (!countryCode || !number) {
        return {
          success: false,
          message: 'Phone number and country code are required',
        };
      }

      const phoneNumber = formatE164(countryCode, number);

      // Network pre-check: catch connectivity issues early
      try {
        await verifyNetworkConnectivity();
      } catch {
        return {
          success: false,
          message:
            'Unable to reach SMS service. Please check your internet connection.',
        };
      }

      // Send OTP via Better Auth
      await auth.api.sendPhoneNumberOTP({
        body: { phoneNumber },
      });

      return { success: true, message: 'OTP sent successfully' };
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

/**
 * Verifies the OTP and creates an authenticated session.
 *
 * Flow:
 * 1. Validates phone number, country code, and OTP
 * 2. Verifies OTP via Better Auth (sets session cookie)
 * 3. Checks if user exists in app database
 * 4. Returns new user status for routing decision
 *
 * @param formData - Must contain 'phoneNumber', 'countryCode', and 'otp'
 * @returns Verification result with user data and new user flag
 */
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

      // Verify OTP using server-side API (sets session cookie immediately)
      const result = await auth.api.verifyPhoneNumber({
        body: { phoneNumber: fullPhoneNumber, code },
        headers: await headers(),
      });

      if (!result) {
        return { success: false, message: 'Invalid or expired OTP' };
      }

      // Check for existing user profile in app database
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

// ==========================================
// User Session Actions
// ==========================================

/**
 * Checks if the authenticated user has a profile in the app database.
 *
 * Used on app load to determine routing:
 * - User exists → go to chats
 * - User doesn't exist → go to onboarding
 * - Not authenticated → go to login
 *
 * @param formData - Must contain 'phoneNumber' and 'countryCode'
 * @returns User profile and session data
 */
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

/**
 * Creates a new user profile during onboarding.
 *
 * Called after phone verification when user completes their profile
 * with username, bio, and avatar selection.
 *
 * @requires Authenticated session
 * @param formData - Must contain 'phone', 'countryCode', 'username', 'bio', 'avatarURL'
 * @returns Created user data
 */
const handleNewUserAction = protectedAction(
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

// ==========================================
// Sign Out
// ==========================================

/**
 * Signs out the current user and redirects to login page.
 *
 * Invalidates the server-side session and clears auth cookies.
 *
 * @requires Authenticated session
 */
const signOutAction = protectedAction(async () => {
  await auth.api.signOut({
    headers: await headers(),
  });
  redirect('/login');
});

// ==========================================
// Exports
// ==========================================

export { handleNewUserAction, signOutAction };
