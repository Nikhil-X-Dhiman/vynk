import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
	schema: "./lib/db/prisma/schema.prisma",
	migrations: {
		path: "./lib/db/prisma/migrations",
	},
	engine: "classic",
	datasource: {
		url: env("DATABASE_URL"),
	},
});
