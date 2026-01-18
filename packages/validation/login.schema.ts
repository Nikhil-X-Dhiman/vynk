import * as z from 'zod';
import { isValidPhoneNumber } from 'libphonenumber-js';

const loginSchema = z.object({
  phoneNumber: z.string().refine(isValidPhoneNumber, {
    message: 'Invalid Phone Number',
  }),
  email: z.email('Invalid Email Address').optional(),
});

const otpSchema = z.string().trim().min(6, {
  message: 'Your one-time password must be 6 characters.',
});


const avatarPageSchema = z.object({
  username: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name is too long')
    .trim(),
  bio: z.string().trim().max(150, 'Bio is too long'),
  avatarUrl: z.string(),
});

const usernameOnlySchema = avatarPageSchema.pick({username: true});
const bioOnlySchema = avatarPageSchema.pick({bio: true});

// const usernameSchema = z
//   .string()
//   .min(2, 'Name must be at least 2 characters')
//   .max(50, 'Name is too long')
//   .trim();

// const bioSchema = z.string().trim().max(150, 'Bio is too long');

export {
  loginSchema,
  otpSchema,
  usernameOnlySchema,
  bioOnlySchema,
  avatarPageSchema,
};
