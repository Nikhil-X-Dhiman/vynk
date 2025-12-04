import { betterAuth } from 'better-auth';
import { env } from 'process';
import { Pool } from 'pg';

export const auth = betterAuth({
  database: new Pool({
    connectionString: env.DATABASE_URL_AUTH,
  }), // built-in Kysely adapter
  secret: env.BETTER_AUTH_SECRET!,
});
