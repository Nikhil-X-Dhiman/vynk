'use server';

/**
 * @fileoverview Avatar & Profile Setup Action
 *
 * Handles new user profile creation during onboarding.
 * Called after phone verification when user sets up their profile
 * (avatar, username, bio).
 *
 * @module app/actions/avatar-actions
 *
 * @example
 * ```tsx
 * // In profile setup form component
 * const [state, formAction] = useActionState(avatarActions, initialState);
 *
 * <form action={formAction}>
 *   <input name="avatarUrl" type="hidden" value={selectedAvatar} />
 *   <input name="username" required />
 *   <input name="bio" />
 *   <input name="phoneNumber" type="hidden" value={phone} />
 *   <input name="countryCode" type="hidden" value={code} />
 *   <input name="consent" type="hidden" value="true" />
 *   <button type="submit">Complete Setup</button>
 * </form>
 * ```
 */

import { createNewUser } from '@repo/db';
import { authenticatedAction, type ActionState } from '@/lib/safe-action';

// ==========================================
// Constants
// ==========================================

/**
 * Required form fields for profile setup.
 */
const REQUIRED_FIELDS = [
  'avatarUrl',
  'username',
  'phoneNumber',
  'countryCode',
  'bio',
] as const;

// ==========================================
// Action
// ==========================================

/**
 * Server action for completing user profile setup.
 *
 * Flow:
 * 1. Validates phone number verification status
 * 2. Extracts and validates form data
 * 3. Checks consent agreement
 * 4. Creates user record in the app database
 *
 * @requires Authenticated session with verified phone number
 */
const avatarActions = authenticatedAction(
  async (ctx, prevState: ActionState, formData: FormData) => {
    const { session } = ctx;

    // Verify phone number is confirmed
    if (!session.user.phoneNumberVerified) {
      return {
        ...prevState,
        success: false,
        message: 'Phone number must be verified before profile setup',
      };
    }

    // Extract and validate required fields
    const fields = Object.fromEntries(
      REQUIRED_FIELDS.map((key) => [key, formData.get(key)?.toString()]),
    ) as Record<(typeof REQUIRED_FIELDS)[number], string | undefined>;

    const missingFields = REQUIRED_FIELDS.filter((key) => !fields[key]);
    if (missingFields.length > 0) {
      return {
        ...prevState,
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
      };
    }

    // Validate consent
    if (formData.get('consent')?.toString() !== 'true') {
      return {
        ...prevState,
        success: false,
        message: 'You must agree to the terms to continue',
      };
    }

    // Create user in app database
    // ID must match auth session user ID for FK constraint consistency
    const result = await createNewUser({
      id: session.user.id,
      phoneNumber: fields.phoneNumber!,
      countryCode: fields.countryCode!,
      username: fields.username!,
      bio: fields.bio!,
      avatarUrl: fields.avatarUrl!,
    });

    if (!result.success) {
      return {
        ...prevState,
        success: false,
        message: result.error,
      };
    }

    return {
      ...prevState,
      success: true,
      message: 'Profile created successfully',
    };
  },
);

export { avatarActions };
