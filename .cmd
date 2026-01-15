- Create Docker Container (use shared namespace if using podman)
docker compose -p vynk up -d

- Install direnv
sudo apt install direnv

- Do this at the root of project
echo "dotenv" > .envrc
direnv allow

- Prisma Schema Types Generation for Kysely
pnpm --filter @repo/db run db:format
pnpm --filter @repo/db run db:validate
pnpm --filter @repo/db run db:generate

- Commit Schema to DB
pnpm --filter @repo/db run db:migrate

- Create DB for better-auth (post cmd in docker compose)
CREATE DATABASE better-auth;

- Create Tables for better-auth (run inside better-auth dir having auth.ts file)
pnpm dlx @better-auth/cli migrate


- Init Project
pnpm i
pnpm run dev:web
