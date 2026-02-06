import { z } from 'zod';
import { isValidPhoneNumber } from 'libphonenumber-js';

// =============================================================================
// Phone Number
// =============================================================================

export const phoneNumberSchema = z.string().refine(isValidPhoneNumber, {
  message: 'Invalid phone number',
});

// =============================================================================
// Login
// =============================================================================

export const loginSchema = z.object({
  phoneNumber: phoneNumberSchema,
  email: z.string().email('Invalid email address').optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

// =============================================================================
// OTP
// =============================================================================

export const otpSchema = z
  .string()
  .trim()
  .length(6, 'OTP must be exactly 6 digits')
  .regex(/^\d+$/, 'OTP must contain only numbers');

export type OtpInput = z.infer<typeof otpSchema>;
