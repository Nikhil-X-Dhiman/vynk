/**
 * @fileoverview Authentication Store
 *
 * Manages user authentication state including session data, user info,
 * and authentication status. Persists to IndexedDB for offline support.
 *
 * @module store/auth
 *
 * @example
 * ```tsx
 * import { useAuthStore } from '@/store';
 *
 * function Profile() {
 *   const { user, isAuthenticated, reset } = useAuthStore();
 *
 *   if (!isAuthenticated) return <LoginPrompt />;
 *
 *   return (
 *     <div>
 *       <h1>Welcome, {user?.name}</h1>
 *       <button onClick={reset}>Logout</button>
 *     </div>
 *   );
 * }
 * ```
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { idbStorage } from '@/lib/utils/indexeddb-store';
import type { Session, User } from 'better-auth';
import type { AuthStore } from './types';

// ==========================================
// Constants
// ==========================================

/** IndexedDB storage key for auth state */
const STORAGE_KEY = 'auth-storage';

// ==========================================
// Initial State
// ==========================================

/**
 * Default authentication state.
 */
const initialState = {
  session: null,
  user: null,
  isAuthenticated: false,
} as const;

// ==========================================
// Store Definition
// ==========================================

/**
 * Authentication store for managing user session state.
 *
 * Features:
 * - Persists to IndexedDB for offline access
 * - Atomic updates for user and session
 * - Automatic authentication status tracking
 */
export const useAuthStore = create(
  persist<AuthStore>(
    (set) => ({
      // Initial state
      ...initialState,

      /**
       * Updates the session and recalculates authentication status.
       * @param session - The new session or null to clear
       */
      setSession: (session: Session | null) => {
        set({ session, isAuthenticated: !!session });
      },

      /**
       * Updates the user data.
       * @param user - The new user or null to clear
       */
      setUser: (user: User | null) => {
        set({ user });
      },

      /**
       * Atomically updates both user and session.
       * Use this after successful authentication.
       * @param user - The authenticated user
       * @param session - The active session
       */
      setAuth: (user: User | null, session: Session | null) => {
        set({
          user,
          session,
          isAuthenticated: !!(user && session),
        });
      },

      /**
       * Resets all authentication state to initial values.
       * Call this on logout or session expiration.
       */
      reset: () => {
        set(initialState);
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => idbStorage),
    },
  ),
);
