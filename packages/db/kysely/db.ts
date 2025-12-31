import { Kysely, PostgresDialect } from 'kysely';
// import { DB } from './types/types';
import { DB } from '../generated/types';
import { env } from 'process';
// import { Pool } from 'pg';
import { Pool } from '../pg/postgres';

const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString: env.DATABASE_URL_APP,
  }),
});

export const db = new Kysely<DB>({
  dialect,
});
