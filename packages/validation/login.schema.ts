import * as z from 'zod';
import { isValidPhoneNumber } from 'libphonenumber-js';

const loginSchema = z.object({
  phoneNumber: z.string().refine(isValidPhoneNumber, {
    message: 'Invalid Phone Number',
  }),
  email: z.email('Invalid Email Address').optional(),
});

const otpSchema = z.object({
  pin: z.string().trim().min(6, {
    message: 'Your one-time password must be 6 characters.',
  }),
});

const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name is too long')
  .trim();

export { loginSchema, otpSchema, nameSchema };
