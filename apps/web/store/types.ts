/**
 * @fileoverview Type definitions for Zustand stores.
 *
 * Defines the shape of state and actions for all application stores
 * including authentication, login flow, and call management.
 *
 * @module store/types
 */

import { Session, User } from 'better-auth';

// ==========================================
// Login Store Types
// ==========================================

/**
 * Login flow step indicator.
 * - 1: Phone number entry
 * - 2: OTP verification
 * - 3: Profile setup
 */
export type LoginStep = 1 | 2 | 3;

/**
 * State managed by the login store.
 */
export interface LoginStoreState {
  /** Current step in the login flow */
  step: LoginStep;
  /** User's phone number (digits only) */
  phoneNumber: string;
  /** Country dialing code (e.g., "+1", "+91") */
  countryCode: string;
  /** Selected avatar URL */
  avatarURL: string;
  /** User's bio/about text */
  about: string;
  /** User's display name */
  name: string;
}

/**
 * Actions available in the login store.
 */
export interface LoginStoreActions {
  /** Updates the current login step */
  setStep: (step: LoginStep) => void;
  /** Updates the phone number */
  setPhoneNumber: (phoneNumber: string) => void;
  /** Updates the country code */
  setCountryCode: (countryCode: string) => void;
  /** Updates the avatar URL */
  setAvatarURL: (avatarURL: string) => void;
  /** Updates the user's bio */
  setAbout: (about: string) => void;
  /** Updates the user's name */
  setName: (name: string) => void;
  /** Resets all login state to initial values */
  reset: () => void;
}

/**
 * Complete login store type combining state and actions.
 */
export interface LoginStore extends LoginStoreState, LoginStoreActions {}

// ==========================================
// Auth Store Types
// ==========================================

/**
 * State managed by the authentication store.
 */
export interface AuthStoreState {
  /** Current user session from better-auth */
  session: Session | null;
  /** Current authenticated user data */
  user: User | null;
  /** Whether the user is currently authenticated */
  isAuthenticated: boolean;
}

/**
 * Actions available in the authentication store.
 */
export interface AuthStoreActions {
  /** Updates the session and authentication status */
  setSession: (session: Session | null) => void;
  /** Updates the user data */
  setUser: (user: User | null) => void;
  /** Updates both user and session atomically */
  setAuth: (user: User | null, session: Session | null) => void;
  /** Resets all auth state (logout) */
  reset: () => void;
}

/**
 * Complete auth store type combining state and actions.
 */
export interface AuthStore extends AuthStoreState, AuthStoreActions {}

// ==========================================
// Legacy Type Aliases (for backwards compatibility)
// ==========================================

/** @deprecated Use `LoginStore` instead */
export type loginStoreTypes = LoginStore;

/** @deprecated Use `AuthStore` instead */
export type authStoreTypes = AuthStore;
