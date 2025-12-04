import { betterAuth } from 'better-auth';
import { emailOTP, phoneNumber } from 'better-auth/plugins';
import { env } from 'process';
import { Pool } from 'pg';
import { request } from 'https';
import { resend } from './resend';
import { twilioClient } from './twilio';
// import { request } from 'http';

export const auth = betterAuth({
  database: new Pool({
    connectionString: env.DATABASE_URL_AUTH,
  }), // built-in Kysely adapter
  advanced: {
    cookiePrefix: 'vynk',
    // useSecureCookies: true,
  },
  // emailVerification: {
  //   sendVerificationEmail: async ({ user, url, token }, request) => {
  //     void sendEmail({
  //       to: user.email,
  //       subject: 'Verify your email address',
  //       text: `Click the link to verify your email: ${url}`,
  //     });
  //   },
  //   sendOnSignUp: true,
  // },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    // storage: 'secondary-storage'
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
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        if (type === 'email-verification') {
          await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'nikhil.x.dhiman@gmail.com',
            subject: 'Hello World',
            html: '<p>Congrats on sending your <strong>first email</strong>!</p>',
          });
        }
      },
    }),
    phoneNumber({
      async sendOTP({ phoneNumber, code }, ctx) {
        await twilioClient.messages.create({
          body: 'Hey ND, Your OTP is 67676767',
          from: env.TWILIO_PHONE_NUMBER,
          to: '+917018419491',
        });
      },
    }),
  ],
  secret: env.BETTER_AUTH_SECRET!,
});

// TODO: Implement Secondary Storage using Redis here. URL: "https://www.better-auth.com/docs/concepts/database"
