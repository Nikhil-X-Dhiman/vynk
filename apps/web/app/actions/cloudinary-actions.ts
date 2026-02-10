'use server';

/**
 * @fileoverview Cloudinary Upload Signature Action
 *
 * Generates signed upload credentials for client-side Cloudinary uploads.
 * This prevents exposing the API secret on the client while allowing
 * direct browser-to-Cloudinary uploads.
 *
 * @module app/actions/cloudinary-actions
 *
 * @example
 * ```ts
 * // In client component
 * const result = await handleCloudinarySignature();
 *
 * if (result.success) {
 *   const { signature, timestamp } = result.data;
 *   // Use signature + timestamp for Cloudinary upload widget
 * }
 * ```
 */

import { v2 as cloudinary } from 'cloudinary';
import { protectedAction } from '@/lib/safe-action';

// ==========================================
// Constants
// ==========================================

/**
 * Cloudinary folder for storing profile pictures.
 */
const UPLOAD_FOLDER = 'vynk_profilePic';

// ==========================================
// Types
// ==========================================

/**
 * Successful signature response.
 */
interface SignatureData {
  signature: string;
  timestamp: number;
}

/**
 * Result type for the signature action.
 */
type SignatureResult =
  | { success: true; data: SignatureData }
  | { success: false; error: string };

// ==========================================
// Action
// ==========================================

/**
 * Generates a signed Cloudinary upload signature.
 *
 * The signature is time-limited (based on timestamp) and scoped
 * to the configured upload folder for security.
 *
 * @requires Authenticated session
 * @returns Signed upload credentials or error
 */
const handleCloudinarySignature = protectedAction(
  async (): Promise<SignatureResult> => {
    const timestamp = Math.round(Date.now() / 1000);

    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!apiSecret) {
      return { success: false, error: 'Cloudinary configuration missing' };
    }

    try {
      const signature = cloudinary.utils.api_sign_request(
        { timestamp, folder: UPLOAD_FOLDER },
        apiSecret,
      );

      return { success: true, data: { signature, timestamp } };
    } catch (error) {
      console.error('[Cloudinary] Signature generation failed:', error);
      return { success: false, error: 'Failed to generate upload signature' };
    }
  },
);

export { handleCloudinarySignature };
