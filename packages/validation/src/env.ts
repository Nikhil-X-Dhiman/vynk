import { z } from 'zod';

export const envSchema = z.object({
  DATABASE_URL_APP: z.url(),
  DATABASE_URL_AUTH: z.url(),
  DATABASE_NAME: z.string(),
  AUTH_DATABASE_NAME: z.string(),
  DATABASE_USER: z.string(),
  DATABASE_HOST: z.string(),
  DATABASE_PORT: z.string().default('5432'),
  DATABASE_MAX_CON: z.string().default('10'),
  DATABASE_PASSWORD: z.string(),
  BETTER_AUTH_URL: z.url(),
  BETTER_AUTH_SECRET: z.string(),
  TWILIO_API_KEY: z.string(),
  TWILIO_ACCOUNT_SID: z.string(),
  TWILIO_AUTH_TOKEN: z.string(),
  TWILIO_PHONE_NUMBER: z.string(),
  RESEND_API_KEY: z.string(),
  CLIENT_SOCKET_URL: z.url(),
  NEXT_PUBLIC_SOCKET_URL: z.url(),
  SERVER_SOCKET_URL: z.url(),
  NEXT_URL: z.url(),
  CLOUDINARY_URL: z.string(),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string(),
  NEXT_PUBLIC_CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string(),
  REDIS_PASSWORD: z.string(),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.string().default('6379'),
  // Docker specific (Optional)
  POSTGRES_USER: z.string().optional(),
  POSTGRES_PASSWORD: z.string().optional(),
  POSTGRES_DB: z.string().optional(),
  PGADMIN_EMAIL: z.email().optional(),
  PGADMIN_PASSWORD: z.string().optional(),
  // Add other vars here
});

export const env = envSchema.parse(process.env);

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envSchema> {}
  }
}

/**
 * --- EXAMPLE USAGE ---
 *
 * 1. Using Global process.env (No imports required):
 * const url = process.env.DATABASE_URL_APP; // Autocomplete ready!
 *
 * 2. Using the validated 'env' object (Recommended for logic):
 * import { env } from '@repo/validation';
 * const dbUrl = env.DATABASE_URL_APP; // Validated at runtime!
 */
