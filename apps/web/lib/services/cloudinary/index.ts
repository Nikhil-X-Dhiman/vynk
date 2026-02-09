/**
 * @fileoverview Cloudinary Service Barrel Export
 *
 * @module lib/services/cloudinary
 */

export { cloudinary, default as cloudinaryDefault } from './client';
export type {
  CloudinaryUploadResult,
  CloudinaryUploadError,
  UploadApiResponse,
  UploadApiErrorResponse,
} from './client';
