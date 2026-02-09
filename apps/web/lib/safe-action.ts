/**
 * @fileoverview Safe Action Utilities
 *
 * Provides Higher-Order Functions (HOFs) for Next.js Server Actions with
 * authentication validation, error handling, and standardized responses.
 *
 * @module lib/safe-action
 *
 * @example
 * ```ts
 * // Authenticated form action
 * export const updateProfile = authenticatedAction<ProfileState>(
 *   async (ctx, prevState, formData) => {
 *     const name = formData.get('name') as string;
 *     // Use ctx.session for user info
 *     return { success: true, message: 'Profile updated' };
 *   }
 * );
 *
 * // Protected direct action
 * export const getSecureData = protectedAction(
 *   async (ctx, id: string) => {
 *     return db.getData({ userId: ctx.session.user.id, id });
 *   }
 * );
 * ```
 */

import { auth } from '@/lib/auth/auth-server';
import { headers } from 'next/headers';

// ==========================================
// Types
// ==========================================

/**
 * Standard response format for server actions.
 *
 * @template T - Type of the data payload
 */
export interface ActionResponse<T = unknown> {
  /** Whether the action succeeded */
  success: boolean;
  /** Human-readable message or structured error object */
  message: string | Record<string, unknown>;
  /** Optional data payload on success */
  data?: T;
  /** Optional error details */
  error?: string;
}

/**
 * Base state type for useActionState hooks.
 * Must include success and message fields.
 */
export interface ActionState {
  /** Whether the action succeeded */
  success: boolean;
  /** Human-readable message or structured error object */
  message: string | Record<string, unknown>;
  /** Allow additional fields for flexibility */
  [key: string]: unknown;
}

/**
 * Context provided to authenticated actions.
 */
export interface AuthContext {
  /** The authenticated user session */
  session: NonNullable<typeof auth.$Infer.Session>;
}

/**
 * Function signature for form-based authenticated actions.
 */
export type AuthenticatedFormAction<State extends ActionState> = (
  ctx: AuthContext,
  prevState: State,
  formData: FormData,
) => Promise<State>;

/**
 * Function signature for direct authenticated actions.
 */
export type AuthenticatedDirectAction<Args extends unknown[], Return> = (
  ctx: AuthContext,
  ...args: Args
) => Promise<Return>;

// ==========================================
// Error Messages
// ==========================================

const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized: Please login to continue',
  UNEXPECTED: 'An unexpected error occurred',
  INTERNAL: 'Internal Server Error',
} as const;

// ==========================================
// Authenticated Actions
// ==========================================

/**
 * HOF for form actions used with useActionState.
 * Validates session before execution and handles errors.
 *
 * @template State - The action state type extending ActionState
 * @param action - The action function to wrap
 * @returns A wrapped action that validates authentication
 *
 * @example
 * ```ts
 * export const submitForm = authenticatedAction<FormState>(
 *   async (ctx, prevState, formData) => {
 *     const userId = ctx.session.user.id;
 *     // Process form...
 *     return { ...prevState, success: true, message: 'Done!' };
 *   }
 * );
 * ```
 */
export function authenticatedAction<State extends ActionState>(
  action: AuthenticatedFormAction<State>,
) {
  return async (prevState: State, formData: FormData): Promise<State> => {
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session) {
        return {
          ...prevState,
          success: false,
          message: ERROR_MESSAGES.UNAUTHORIZED,
        } as State;
      }

      return await action({ session }, prevState, formData);
    } catch (error) {
      console.error('[AuthenticatedAction] Error:', error);
      return {
        ...prevState,
        success: false,
        message: ERROR_MESSAGES.UNEXPECTED,
      } as State;
    }
  };
}

/**
 * HOF for direct server actions (not useActionState).
 * Validates session before execution and throws on unauthorized.
 *
 * @template Args - Tuple type for action arguments
 * @template Return - Return type of the action
 * @param action - The action function to wrap
 * @returns A wrapped action that validates authentication
 *
 * @example
 * ```ts
 * export const getUser = protectedAction(
 *   async (ctx, userId: string) => {
 *     return db.getUser(userId);
 *   }
 * );
 *
 * // Usage
 * const user = await getUser('user-123');
 * ```
 */
export function protectedAction<Args extends unknown[], Return>(
  action: AuthenticatedDirectAction<Args, Return>,
) {
  return async (...args: Args): Promise<Return> => {
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session) {
        throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
      }

      return await action({ session }, ...args);
    } catch (error) {
      console.error('[ProtectedAction] Error:', error);

      if (
        error instanceof Error &&
        error.message === ERROR_MESSAGES.UNAUTHORIZED
      ) {
        throw error;
      }

      throw new Error(ERROR_MESSAGES.INTERNAL);
    }
  };
}

// ==========================================
// Public Actions
// ==========================================

/**
 * HOF for public form actions (no authentication required).
 * Provides error handling for useActionState patterns.
 *
 * @template State - The action state type extending ActionState
 * @param action - The action function to wrap
 * @returns A wrapped action with error handling
 *
 * @example
 * ```ts
 * export const submitContact = publicAction<ContactFormState>(
 *   async (prevState, formData) => {
 *     const email = formData.get('email') as string;
 *     return { ...prevState, success: true, message: 'Sent!' };
 *   }
 * );
 * ```
 */
export function publicAction<State extends ActionState>(
  action: (prevState: State, formData: FormData) => Promise<State>,
) {
  return async (prevState: State, formData: FormData): Promise<State> => {
    try {
      return await action(prevState, formData);
    } catch (error) {
      console.error('[PublicAction] Error:', error);
      return {
        ...prevState,
        success: false,
        message: ERROR_MESSAGES.UNEXPECTED,
      } as State;
    }
  };
}

/**
 * HOF for public direct actions (no authentication, no prevState).
 * Provides error handling for direct function calls.
 *
 * @template Args - Tuple type for action arguments
 * @template Return - Return type of the action
 * @param action - The action function to wrap
 * @returns A wrapped action with error handling
 *
 * @example
 * ```ts
 * export const getPublicData = publicDirectAction(
 *   async (id: string) => {
 *     return db.getPublicData(id);
 *   }
 * );
 * ```
 */
export function publicDirectAction<Args extends unknown[], Return>(
  action: (...args: Args) => Promise<Return>,
) {
  return async (...args: Args): Promise<Return> => {
    try {
      return await action(...args);
    } catch (error) {
      console.error('[PublicDirectAction] Error:', error);
      throw error;
    }
  };
}

// ==========================================
// Utility Functions
// ==========================================

/**
 * Creates a success response object.
 *
 * @template T - Type of the data payload
 * @param data - The data to include
 * @param message - Optional success message
 * @returns A standardized success response
 */
export function successResponse<T>(
  data: T,
  message = 'Success',
): ActionResponse<T> {
  return { success: true, message, data };
}

/**
 * Creates an error response object.
 *
 * @param message - The error message
 * @param error - Optional error details
 * @returns A standardized error response
 */
export function errorResponse(
  message: string,
  error?: string,
): ActionResponse<never> {
  return { success: false, message, error };
}
