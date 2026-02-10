import { z } from 'zod';

// =============================================================================
// Environment Schema
// =============================================================================

export const envSchema = z.object({
  // Database
  DATABASE_URL_APP: z.string().url(),
  DATABASE_URL_AUTH: z.string().url(),
  DATABASE_NAME: z.string(),
  AUTH_DATABASE_NAME: z.string(),
  DATABASE_USER: z.string(),
  DATABASE_HOST: z.string(),
  DATABASE_PORT: z.string().default('5432'),
  DATABASE_MAX_CON: z.string().default('10'),
  DATABASE_PASSWORD: z.string(),

  // Authentication
  BETTER_AUTH_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),

  // Twilio (SMS)
  TWILIO_API_KEY: z.string(),
  TWILIO_ACCOUNT_SID: z.string().startsWith('AC'),
  TWILIO_AUTH_TOKEN: z.string(),
  TWILIO_PHONE_NUMBER: z.string().startsWith('+'),

  // Email
  RESEND_API_KEY: z.string(),

  // Socket
  CLIENT_SOCKET_URL: z.string().url(),
  NEXT_PUBLIC_SOCKET_URL: z.string().url(),
  SERVER_SOCKET_URL: z.string().url(),
  NEXT_URL: z.string().url(),

  // Cloudinary
  CLOUDINARY_URL: z.string(),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string(),
  NEXT_PUBLIC_CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string(),

  // Redis
  REDIS_PASSWORD: z.string(),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.string().default('6379'),

  // Docker (Optional)
  POSTGRES_USER: z.string().optional(),
  POSTGRES_PASSWORD: z.string().optional(),
  POSTGRES_DB: z.string().optional(),
  PGADMIN_EMAIL: z.string().email().optional(),
  PGADMIN_PASSWORD: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

// =============================================================================
// Parsed Environment
// =============================================================================

/**
 * Validates and parses environment variables.
 * Throws an error if validation fails.
 */
function parseEnv(): Env {
  // Skip validation on the client side
  if (typeof window !== 'undefined') {
    return process.env as unknown as Env;
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }

  return result.data;
}

export const env = parseEnv();

// =============================================================================
// Global Type Augmentation
// =============================================================================

declare global {
  namespace NodeJS {
    interface ProcessEnv extends Env {}
  }
}
