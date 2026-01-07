import { defineConfig } from 'prisma/config';
import path from 'node:path';
import dotenv from 'dotenv';
import { env } from 'prisma/config';

// Load the .env from the monorepo root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
// import dotenv from 'dotenv';

// dotenv.config({ quiet: true, path: '../../.env' });

// config({ path: '../../.env' });

// Load the root monorepo .env

export default defineConfig({
  schema: './schema/schema.prisma',
  migrations: {
    path: './prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL_APP'),
  },
});
