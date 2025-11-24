import * as z from 'zod';

export const loginSchema = z.object({
  countryCode: z.string().trim(),
  phone: z.string().trim(),
  email: z.email().optional(),
});

export const otpSchema = z.object({
  pin: z.string().trim().min(6, {
    message: 'Your one-time password must be 6 characters.',
  }),
});

// export const countryCodeSchema = z.string().trim();
// export const phoneSchema = z.string().trim();
// export const emailSchema = z.email().optional();
