import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";
import { DB } from "@/lib/db/types";

const dialect = new PostgresDialect({
	pool: new Pool({
		database: "vynk",
		host: "localhost",
		user: "admin",
		port: 5432,
		max: 10,
	}),
});

export const db = new Kysely<DB>({
	dialect,
});
