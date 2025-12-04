import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
// import { DB } from './types';
import { env } from 'process';

const dialect = new PostgresDialect({
  // pool: new Pool({
  //   database: env.DATABASE_NAME,
  //   host: env.DATABASE_HOST,
  //   user: env.DATABASE_USER,
  //   port: Number(env.DATABASE_PORT),
  //   max: Number(env.DATABASE_MAX_CON),
  // }),
  pool: new Pool({
    connectionString: env.DATABASE_URL_APP,
  }),
});

// export const db = new Kysely<DB>({
//   dialect,
// });
export const db = new Kysely({
  dialect,
});
