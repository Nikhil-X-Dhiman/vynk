import { Kysely, PostgresDialect } from 'kysely';
import { DB } from './generated/types';
import { env } from '@repo/validation';
import { Pool } from 'pg';

const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString: env.DATABASE_URL_APP,
    max: parseInt(env.DATABASE_MAX_CON || '10'),
  }),
});

const globalForDb = globalThis as unknown as { db: Kysely<DB> | undefined };

export const db =
  globalForDb.db ??
  new Kysely<DB>({
    dialect,
    log:
      process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  });

// Hot Reload Connection Check: Prevents creating a new database connection pool on every hot reload
if (process.env.NODE_ENV !== 'production') globalForDb.db = db;
