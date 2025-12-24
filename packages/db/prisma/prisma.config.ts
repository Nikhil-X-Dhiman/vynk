import { defineConfig, env } from 'prisma/config';

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
