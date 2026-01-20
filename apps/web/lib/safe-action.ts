
import { auth } from '@/lib/auth/auth-server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Standard response format for server actions
 */
export type ActionResponse<T = unknown> = {
  success: boolean;
  message: string | Record<string, unknown>;
  data?: T;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

/**
 * Base type for useActionState actions
 */
export type ActionState = {
  success: boolean;
  message: string | Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

/**
 * Validated Context for Authenticated Actions
 */
export type AuthContext = {
  session: typeof auth.$Infer.Session;
};

/**
 * HOF for actions used with useActionState (FormData)
 * Validates session before execution.
 */
export const authenticatedAction = <State extends ActionState>(
  action: (
    ctx: AuthContext,
    prevState: State,
    formData: FormData
  ) => Promise<State>
) => {
  return async (prevState: State, formData: FormData): Promise<State> => {
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session) {
        return {
          ...prevState,
          success: false,
          message: 'Unauthorized: Please login to continue',
        } as State;
      }

      return await action(
        { session: session },
        prevState,
        formData
      );
    } catch (error) {
      console.error('Action Error:', error);
      return {
        ...prevState,
        success: false,
        message: 'An unexpected error occurred',
      } as State;
    }
  };
};

/**
 * HOF for standard async server actions (not useActionState)
 * Useful for direct calls like fetching signatures or data.
 */
export const protectedAction = <Args extends unknown[], Return>(
  action: (ctx: AuthContext, ...args: Args) => Promise<Return>
) => {
  return async (...args: Args): Promise<ActionResponse<Return> | Return> => {
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session) {
        // If it's a direct call, we can throw or return a standardized error object.
        // For consistency with client expectations, returning an object is usually safer than throwing.
        // However, if the return type doesn't match ActionResponse, we might have issues.
        // For now, let's assume standard response structure or simple null check.

        // Throwing allows the client to handle it via try/catch,
        // but returning { success: false } is often preferred in Next.js Server Actions.
        // We will try to return a standard error shape if possible,
        // but since Return generic is arbitrary, we'll throw if we can't match it.
        throw new Error('Unauthorized');
      }

      return await action({ session: session }, ...args);
    } catch (error) {
      console.error('Protected Action Error:', error);
      if (error instanceof Error && error.message === 'Unauthorized') {
         // Re-throw standardized errors or handle them
         throw error;
      }
      throw new Error('Internal Server Error');
    }
  };
};

export const publicAction = <State extends ActionState>(
    action: (
      prevState: State,
      formData: FormData
    ) => Promise<State>
  ) => {
    return async (prevState: State, formData: FormData): Promise<State> => {
      try {
        return await action(prevState, formData);
      } catch (error) {
        console.error('Public Action Error:', error);
        return {
            ...prevState,
            success: false,
            message: 'An unexpected error occurred',
        } as State;
      }
    };
  };

/**
 * HOF for public direct actions (no session check, no prevState)
 */
export const publicDirectAction = <Args extends unknown[], Return>(
  action: (...args: Args) => Promise<Return>
) => {
  return async (...args: Args): Promise<ActionResponse<Return> | Return> => {
    try {
      return await action(...args);
    } catch (error) {
       console.error('Public Direct Action Error:', error);
       // Return a generic error object or rethrow depending on needs.
       // For simplified usage matching protectedAction structure:
       throw error;
    }
  };
};
