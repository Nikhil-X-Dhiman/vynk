/**
 * @fileoverview Store Barrel Export
 *
 * Re-exports all Zustand stores and their types for convenient imports.
 *
 * @module store
 *
 * @example
 * ```tsx
 * import { useAuthStore, useLoginStore, useCallStore } from '@/store';
 * import type { AuthStore, LoginStore, CallStore } from '@/store';
 * ```
 */

// Stores
export { useAuthStore } from './auth';
export { useLoginStore } from './login'
// Types
export type {
  // Auth types
  AuthStore,
  AuthStoreState,
  AuthStoreActions,
  // Login types
  LoginStore,
  LoginStoreState,
  LoginStoreActions,
  LoginStep,
  // Legacy aliases (deprecated)
  loginStoreTypes,
  authStoreTypes,
} from './types';
