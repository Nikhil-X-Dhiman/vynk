// import { Pool } from 'pg';
// import { Kysely, PostgresDialect } from 'kysely';
// // import { DB } from './types';
// import { env } from 'process';

// const dialect = new PostgresDialect({
//   pool: new Pool({
//     database: env.AUTH_DATABASE_NAME,
//     host: env.DATABASE_HOST,
//     user: env.DATABASE_USER,
//     port: Number(env.DATABASE_PORT),
//     max: Number(env.DATABASE_MAX_CON),
//     password: env.DATABASE_PASSWORD,
//   }),
// });

// // export const db = new Kysely<DB>({
// //   dialect,
// // });
// // import { kyselyAdapter } from 'better-auth/adapters/kysely';
// // export const auth_db = kyselyAdapter(new Kysely({ dialect }));

// export const auth_db = new Kysely<unknown>({
//   dialect,
// });
