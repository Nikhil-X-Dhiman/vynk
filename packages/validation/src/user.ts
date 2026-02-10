import { z } from 'zod';

// =============================================================================
// Username
// =============================================================================

export const usernameSchema = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name is too long');

export type UsernameInput = z.infer<typeof usernameSchema>;

// =============================================================================
// Bio
// =============================================================================

export const bioSchema = z
  .string()
  .trim()
  .max(150, 'Bio is too long');

export type BioInput = z.infer<typeof bioSchema>;

// =============================================================================
// Avatar URL
// =============================================================================

export const avatarUrlSchema = z
  .string()
  .url()
  .or(z.string().startsWith('/'))
  .or(z.literal(''))

export type AvatarUrlInput = z.infer<typeof avatarUrlSchema>;

// =============================================================================
// Complete Profile
// =============================================================================

export const profileSchema = z.object({
  username: usernameSchema,
  bio: bioSchema,
  avatarUrl: avatarUrlSchema,
});

export type ProfileInput = z.infer<typeof profileSchema>;

// Partial schemas for individual field updates
export const usernameOnlySchema = profileSchema.pick({ username: true });
export const bioOnlySchema = profileSchema.pick({ bio: true });
export const avatarOnlySchema = profileSchema.pick({ avatarUrl: true });

export type UsernameOnlyInput = z.infer<typeof usernameOnlySchema>;
export type BioOnlyInput = z.infer<typeof bioOnlySchema>;
export type AvatarOnlyInput = z.infer<typeof avatarOnlySchema>;
