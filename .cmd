# =============================================================================
# VYNK - Command Reference
# =============================================================================
# Quick reference for development, deployment, and emergency situations.
# Keep this file updated as the project evolves.
# =============================================================================


# =============================================================================
# 🚀 QUICK START (New Developer Setup)
# =============================================================================

# 1. Clone and install dependencies
pnpm i

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# 3. Set up direnv for automatic env loading
sudo apt install direnv
echo 'eval "$(direnv hook zsh)"' >> ~/.zshrc  # or ~/.bashrc for bash
source ~/.zshrc
echo "dotenv" > .envrc
direnv allow

# 4. Start infrastructure (Docker)
docker compose -p vynk up -d

# 5. Set up databases
pnpm --filter @repo/db run db:generate
pnpm --filter @repo/db run db:migrate

# 6. Start development
pnpm run dev


# =============================================================================
# 🐳 DOCKER / INFRASTRUCTURE
# =============================================================================

# Start all containers
docker compose -p vynk up -d

# Stop all containers
docker compose -p vynk down

# View logs
docker compose -p vynk logs -f

# View specific service logs
docker compose -p vynk logs -f postgres
docker compose -p vynk logs -f redis

# Restart a specific service
docker compose -p vynk restart postgres

# Rebuild containers (after Dockerfile changes)
docker compose -p vynk up -d --build

# Remove all containers and volumes (DESTRUCTIVE - resets data)
docker compose -p vynk down -v

# Shell into container
docker compose -p vynk exec postgres bash
docker compose -p vynk exec redis redis-cli

# Check container status
docker compose -p vynk ps


# =============================================================================
# 🗄️ DATABASE (Prisma + Kysely)
# =============================================================================

# Format schema
pnpm --filter @repo/db run db:format

# Validate schema
pnpm --filter @repo/db run db:validate

# Generate Prisma client + Kysely types
pnpm --filter @repo/db run db:generate

# Create and apply migration
pnpm --filter @repo/db run db:migrate

# Push schema changes (dev only, no migration file)
pnpm --filter @repo/db run db:push

# Open Prisma Studio (GUI)
pnpm --filter @repo/db run db:studio

# Reset database (DESTRUCTIVE)
pnpm --filter @repo/db run db:reset

# Full database sync (format + validate + generate + migrate)
pnpm --filter @repo/db run db:format && \
pnpm --filter @repo/db run db:validate && \
pnpm --filter @repo/db run db:generate && \
pnpm --filter @repo/db run db:migrate


# =============================================================================
# 🔐 AUTHENTICATION (Better Auth)
# =============================================================================

# Create auth database (run in PostgreSQL)
CREATE DATABASE "better-auth";

# Run Better Auth migrations
pnpm dlx @better-auth/cli migrate

# Generate auth schema
pnpm dlx @better-auth/cli generate


# =============================================================================
# 🏃 DEVELOPMENT
# =============================================================================

# Start all apps in dev mode
pnpm run dev

# Start specific apps
pnpm run dev:web        # Next.js web app
pnpm run dev:sockets    # Socket.io server

# Type checking
pnpm run typecheck

# Linting
pnpm run lint
pnpm run lint:fix

# Format code
pnpm run format

# Build all packages
pnpm run build

# Clean all build artifacts
pnpm run clean


# =============================================================================
# 📦 PACKAGE MANAGEMENT
# =============================================================================

# Install all dependencies
pnpm i

# Add dependency to specific package
pnpm --filter @repo/web add <package>
pnpm --filter @repo/db add <package>
pnpm --filter @repo/sockets add <package>

# Add dev dependency
pnpm --filter @repo/web add -D <package>

# Update all dependencies
pnpm update

# Update specific package
pnpm --filter @repo/web update <package>

# Remove dependency
pnpm --filter @repo/web remove <package>

# List outdated packages
pnpm outdated


# =============================================================================
# 🔄 REDIS
# =============================================================================

# Connect to Redis CLI
docker compose -p vynk exec redis redis-cli

# Inside Redis CLI:
PING                          # Check connection
KEYS *                        # List all keys (use sparingly in prod)
GET <key>                     # Get value
DEL <key>                     # Delete key
FLUSHDB                       # Clear current database (DESTRUCTIVE)
FLUSHALL                      # Clear all databases (DESTRUCTIVE)
INFO                          # Server info
MONITOR                       # Real-time command logging


# =============================================================================
# 🐘 POSTGRESQL
# =============================================================================

# --- Connection ---

# Connect to PostgreSQL (default postgres db)
docker compose -p vynk exec postgres psql -U postgres

# Connect directly to app database
docker compose -p vynk exec postgres psql -U postgres -d vynk

# Connect with password prompt
docker compose -p vynk exec postgres psql -U postgres -W


# --- PSQL Meta-Commands (inside psql) ---

# Database Operations
\l                            # List all databases
\l+                           # List databases with size info
\c vynk                       # Connect to database
\conninfo                     # Show current connection info

# Table Operations
\dt                           # List tables in current schema
\dt+                          # List tables with size info
\dt *.*                       # List all tables in all schemas
\d "user"                     # Describe table structure
\d+ "user"                    # Describe table with extra info (size, etc)

# Schema & Types
\dn                           # List schemas
\dT                           # List data types
\dT+                          # List data types with details

# Indexes & Constraints
\di                           # List indexes
\di+ "user"                   # Show indexes for specific table

# Functions & Views
\df                           # List functions
\dv                           # List views

# Users & Permissions
\du                           # List users/roles
\dp                           # List table privileges

# Query Output
\x                            # Toggle expanded display (vertical output)
\x auto                       # Auto-detect when to use expanded
\timing                       # Toggle query timing

# History & Help
\s                            # Show command history
\?                            # Help for psql commands
\h SELECT                     # SQL command help

# Exit
\q                            # Quit psql


# --- Common SQL Queries ---

# Count records in all tables
SELECT schemaname, relname, n_live_tup
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

# Get table sizes
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC;

# Get database size
SELECT pg_size_pretty(pg_database_size('vynk'));

# List all columns for a table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user';

# List all foreign keys
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table,
  ccu.column_name AS foreign_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';

# List all indexes
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public';

# Check active connections
SELECT pid, usename, application_name, client_addr, state, query
FROM pg_stat_activity
WHERE datname = 'vynk';

# Kill a connection (replace <pid>)
SELECT pg_terminate_backend(<pid>);


# --- Data Inspection Queries ---

# Recent users
SELECT id, user_name, phone_number, created_at
FROM "user"
ORDER BY created_at DESC
LIMIT 10;

# Recent messages
SELECT id, conversation_id, sender_id, content, created_at
FROM "message"
ORDER BY created_at DESC
LIMIT 10;

# Conversation participant counts
SELECT conversation_id, COUNT(*) as participant_count
FROM "participant"
GROUP BY conversation_id;

# Unread message counts per user
SELECT user_id, SUM(unread_count) as total_unread
FROM "participant"
GROUP BY user_id
ORDER BY total_unread DESC;


# --- Maintenance ---

# Vacuum (reclaim storage)
VACUUM;
VACUUM ANALYZE;              # Also update statistics
VACUUM FULL "user";          # Full vacuum specific table (locks table)

# Reindex
REINDEX TABLE "user";
REINDEX DATABASE vynk;

# Analyze (update query planner stats)
ANALYZE;
ANALYZE "user";


# --- Backup & Restore ---

# Backup entire database
docker compose -p vynk exec postgres pg_dump -U postgres vynk > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup specific table
docker compose -p vynk exec postgres pg_dump -U postgres -t "user" vynk > users_backup.sql

# Backup schema only (no data)
docker compose -p vynk exec postgres pg_dump -U postgres --schema-only vynk > schema.sql

# Backup data only (no schema)
docker compose -p vynk exec postgres pg_dump -U postgres --data-only vynk > data.sql

# Restore database
docker compose -p vynk exec -T postgres psql -U postgres vynk < backup.sql

# Restore specific table
docker compose -p vynk exec -T postgres psql -U postgres vynk < users_backup.sql


# --- Emergency Queries ---

# Find slow queries (requires pg_stat_statements extension)
SELECT query, calls, mean_time, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

# Check for table locks
SELECT
  pg_class.relname,
  pg_locks.mode,
  pg_locks.granted
FROM pg_locks
JOIN pg_class ON pg_locks.relation = pg_class.oid
WHERE pg_class.relkind = 'r';

# Check disk usage
SELECT
  sum(pg_database_size(datname)) as total_size,
  pg_size_pretty(sum(pg_database_size(datname))) as pretty_size
FROM pg_database;

# Reset sequences (after manual inserts)
SELECT setval(pg_get_serial_sequence('"user"', 'id'), COALESCE(MAX(id), 1)) FROM "user";


# =============================================================================
# 🚨 EMERGENCY / TROUBLESHOOTING
# =============================================================================

# --- Container Issues ---

# Container won't start? Check logs
docker compose -p vynk logs postgres
docker compose -p vynk logs redis

# Port already in use?
lsof -i :5432    # Check what's using PostgreSQL port
lsof -i :6379    # Check what's using Redis port
lsof -i :3000    # Check what's using Next.js port
lsof -i :3001    # Check what's using Socket port

# Kill process on port
kill -9 $(lsof -t -i:3000)

# --- Database Issues ---

# Connection refused? Restart containers
docker compose -p vynk restart

# Schema out of sync?
pnpm --filter @repo/db run db:push

# Corrupted migration? Reset (DESTRUCTIVE)
pnpm --filter @repo/db run db:reset

# --- Redis Issues ---

# Clear all cache
docker compose -p vynk exec redis redis-cli FLUSHALL

# Check memory usage
docker compose -p vynk exec redis redis-cli INFO memory

# --- Node/pnpm Issues ---

# Clear node_modules and reinstall
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm i

# Clear pnpm cache
pnpm store prune

# Clear Next.js cache
rm -rf apps/web/.next

# --- Build Issues ---

# Full clean rebuild
pnpm run clean
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm i
pnpm run build


# =============================================================================
# 🚢 PRODUCTION
# =============================================================================

# Build for production
pnpm run build

# Start production server
pnpm run start

# Environment check
node -e "console.log(process.env.NODE_ENV)"


# =============================================================================
# 🔍 DEBUGGING
# =============================================================================

# Check TypeScript errors
pnpm run typecheck

# Check for circular dependencies
npx madge --circular apps/web/src

# Analyze bundle size
ANALYZE=true pnpm --filter @repo/web run build

# Debug Next.js
NODE_OPTIONS='--inspect' pnpm run dev:web


# =============================================================================
# 📱 MOBILE (if applicable)
# =============================================================================

# Start Expo dev server
pnpm --filter @repo/mobile run start

# Start iOS simulator
pnpm --filter @repo/mobile run ios

# Start Android emulator
pnpm --filter @repo/mobile run android


# =============================================================================
# 🧪 TESTING
# =============================================================================

# Run all tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run tests with coverage
pnpm run test:coverage


# =============================================================================
# 📝 GIT SHORTCUTS
# =============================================================================

# Amend last commit
git commit --amend --no-edit

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard all local changes
git checkout -- .
git clean -fd

# Sync with main
git fetch origin
git rebase origin/main

# Interactive rebase last N commits
git rebase -i HEAD~3
