/**
 * @fileoverview Cloudinary Client Configuration
 *
 * Configures and exports the Cloudinary SDK for server-side image
 * and video uploads. Uses environment variables for authentication.
 *
 * @module lib/services/cloudinary/client
 *
 * @example
 * ```ts
 * import { cloudinary } from '@/lib/services/cloudinary';
 *
 * // Generate a signed upload URL
 * const timestamp = Math.round(Date.now() / 1000);
 * const signature = cloudinary.utils.api_sign_request(
 *   { timestamp, folder: 'avatars' },
 *   process.env.CLOUDINARY_API_SECRET!
 * );
 *
 * // Server-side upload
 * const result = await cloudinary.uploader.upload(filePath, {
 *   folder: 'avatars',
 *   transformation: [{ width: 200, height: 200, crop: 'fill' }],
 * });
 * ```
 */

import { v2 as cloudinarySDK } from 'cloudinary';
import type { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

// ==========================================
// Configuration
// ==========================================

/**
 * Configure Cloudinary with environment credentials.
 * Must be called before using any Cloudinary methods.
 */
cloudinarySDK.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// ==========================================
// Exports
// ==========================================

/**
 * Pre-configured Cloudinary SDK instance.
 *
 * @see https://cloudinary.com/documentation/node_integration
 */
export const cloudinary = cloudinarySDK;

/**
 * Default export for convenience.
 */
export default cloudinarySDK;

/**
 * Re-export commonly used types.
 */
export type { UploadApiResponse, UploadApiErrorResponse };

/**
 * Upload result type alias for cleaner imports.
 */
export type CloudinaryUploadResult = UploadApiResponse;

/**
 * Upload error type alias.
 */
export type CloudinaryUploadError = UploadApiErrorResponse;
