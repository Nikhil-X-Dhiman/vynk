import { xid, z } from 'zod';

export const envSchema = z.object({
  DATABASE_URL_APP: z.url(),
  DATABASE_URL_AUTH: z.url(),
  DATABASE_NAME: z.string(),
  AUTH_DATABASE_NAME: z.string(),
  DATABASE_USER: z.string().default('user'),
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
  REDIS_HOST: z.string(),
  REDIS_PORT: z.string().default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  // Add other vars here
});

export const env = envSchema.parse(process.env);

// Now do just like this to access env variables
// import { env } from '@repo/validation';

// const redis = createClient({
//   url: `redis://${env.REDIS_HOST}:${env.REDIS_PORT}`,
// });
