/**
 * @fileoverview Server Actions Barrel Export
 *
 * Re-exports all server actions for convenient imports.
 *
 * @module app/actions
 *
 * @example
 * ```ts
 * import {
 *   sendOTPAction,
 *   verifyOTPAction,
 *   signOutAction,
 * } from '@/app/actions';
 * ```
 */

// Authentication actions
export {
  sendOTPAction,
  verifyOTPAction,
  handleCheckUserAndSessionAction,
  handleNewUserAction,
  signOutAction,
} from './login-auth';

// Profile setup action
export { avatarActions } from './avatar-actions';

// Cloudinary upload signature
export { handleCloudinarySignature } from './cloudinary-actions';
