import { defineConfig } from 'prisma/config';
import { env } from 'prisma/config';


export default defineConfig({
  schema: './schema/schema.prisma',
  migrations: {
    path: './prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL_APP'),
  },
});
