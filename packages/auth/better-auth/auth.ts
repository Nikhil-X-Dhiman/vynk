import { betterAuth } from 'better-auth';
import { phoneNumber } from 'better-auth/plugins';
import { nextCookies } from 'better-auth/next-js';
import { env } from '@repo/validation';
import { Pool } from '@repo/db';
import { twilioClient } from '@repo/services';
import { createClient } from 'redis';


const redis = createClient({
  url: `redis://${env.REDIS_HOST}:${env.REDIS_PORT}`,
  password: env.REDIS_PASSWORD,
});

redis.on('error', (err: any) => console.log('Redis Client Error', err));
redis.connect();

const auth = betterAuth({
  database: new Pool({
    connectionString: env.DATABASE_URL_AUTH,
  }), // built-in Kysely adapter
  advanced: {
    cookiePrefix: 'vynk',
    useSecureCookies: true,
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    storage: 'secondary-storage',
  },
  secondaryStorage: {
    get: async (key: string) => {
      const value = await redis.get(key);
      return value ? value : null;
    },
    set: async (key: string, value: string, ttl?: number) => {
      if (ttl) await redis.set(key, value, { EX: ttl });
      else await redis.set(key, value);
    },
    delete: async (key: string) => {
      await redis.del(key);
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
      strategy: 'jwe',
      // refreshCache: true,
    },
  },
  plugins: [
    phoneNumber({
      async sendOTP({ phoneNumber, code }) {
        await twilioClient.messages.create({
          body: `Hey ND, Your OTP is ${code}`,
          from: env.TWILIO_PHONE_NUMBER,
          to: phoneNumber,
        });
      },
      signUpOnVerification: {
        getTempEmail: (phoneNumber) => {
          return `${phoneNumber}@vynk.co.in`;
        },
        getTempName: (phoneNumber) => {
          return phoneNumber;
        },
      },
      requireVerification: true,
    }),
    nextCookies(),
  ],
  secret: env.BETTER_AUTH_SECRET!,
});


export { auth };
