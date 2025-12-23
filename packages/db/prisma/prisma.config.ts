import { defineConfig, env } from 'prisma/config';
import { config } from 'dotenv';
import { join } from 'path';

// Load the root monorepo .env
config({ path: join(__dirname, '../../.env') });

export default defineConfig({
  schema: './prisma/schema/schema.prisma',
  migrations: {
    path: './prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL_APP'),
  },
});
