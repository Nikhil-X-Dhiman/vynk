/**
 * @fileoverview Login Flow Store
 *
 * Manages the multi-step login/registration flow state including
 * phone verification, OTP handling, and profile setup. Persists
 * to IndexedDB to preserve state across page refreshes.
 *
 * @module store/login
 *
 * @example
 * ```tsx
 * import { useLoginStore } from '@/store';
 *
 * function PhoneStep() {
 *   const { phoneNumber, setPhoneNumber, setStep } = useLoginStore();
 *
 *   const handleSubmit = () => {
 *     // Send OTP...
 *     setStep(2);
 *   };
 *
 *   return (
 *     <input
 *       value={phoneNumber}
 *       onChange={(e) => setPhoneNumber(e.target.value)}
 *     />
 *   );
 * }
 * ```
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { idbStorage } from '@/lib/utils/indexeddb-store';
import type { LoginStore, LoginStep } from './types';

// ==========================================
// Constants
// ==========================================

/** IndexedDB storage key for login state */
const STORAGE_KEY = 'login-storage';

/** Default avatar for new users */
const DEFAULT_AVATAR = '';

/** Default bio for new users */
const DEFAULT_BIO = '';

// ==========================================
// Initial State
// ==========================================

/**
 * Default login flow state.
 */
const initialState = {
  step: 1 as LoginStep,
  phoneNumber: '',
  countryCode: '',
  avatarURL: DEFAULT_AVATAR,
  about: DEFAULT_BIO,
  name: '',
} as const;

// ==========================================
// Store Definition
// ==========================================

/**
 * Login flow store for managing registration/login state.
 *
 * Features:
 * - Multi-step flow management (phone → OTP → profile)
 * - Persists to IndexedDB across page refreshes
 * - Full reset capability for starting over
 */
export const useLoginStore = create(
  persist<LoginStore>(
    (set) => ({
      // Initial state
      ...initialState,

      /**
       * Advances or sets the current login step.
       * @param step - The step to navigate to (1, 2, or 3)
       */
      setStep: (step: LoginStep) => {
        set({ step });
      },

      /**
       * Updates the phone number.
       * @param phoneNumber - Phone number (digits only)
       */
      setPhoneNumber: (phoneNumber: string) => {
        set({ phoneNumber });
      },

      /**
       * Updates the country dialing code.
       * @param countryCode - Country code (e.g., "+1", "+91")
       */
      setCountryCode: (countryCode: string) => {
        set({ countryCode });
      },

      /**
       * Updates the selected avatar URL.
       * @param avatarURL - URL or path to avatar image
       */
      setAvatarURL: (avatarURL: string) => {
        set({ avatarURL });
      },

      /**
       * Updates the user's bio/about text.
       * @param about - User's bio description
       */
      setAbout: (about: string) => {
        set({ about });
      },

      /**
       * Updates the user's display name.
       * @param name - User's display name
       */
      setName: (name: string) => {
        set({ name });
      },

      /**
       * Resets all login state to initial values.
       * Call this after successful registration or to start over.
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
