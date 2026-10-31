# Operational Memory MVP

MVP scaffold for a field-first knowledge continuity platform for engineering teams.

## Workspaces
- `apps/web`: Next.js MVP app (capture, review, search, dashboard)
- `apps/api`: Fastify scaffold (not required for current web vertical slice)
- `prisma`: PostgreSQL schema + seed data

## Persistence model
- Prisma/PostgreSQL backs knowledge records.
- Service boundary remains in `apps/web/src/lib/knowledge-service.ts`.
- Repository implementation lives in `apps/web/src/lib/prisma-knowledge-repository.ts`.
- Authentication uses Auth.js credentials provider backed by `AppUser` in Postgres.
- Audit events are persisted for record creation and status changes.

## Local setup
1. Ensure local PostgreSQL is running and your DB role can login and create databases.
2. Create databases:
   - `createdb -h localhost -U <db_user> operational_memory_mvp`
   - `createdb -h localhost -U <db_user> operational_memory_mvp_test`
3. Copy `.env.example` to `.env` and set `DATABASE_URL`, `TEST_DATABASE_URL`, and `AUTH_SECRET`.
4. Install dependencies: `npm install`
5. Generate Prisma client: `npm run db:generate`
6. Run migration: `npm run db:migrate`
7. Seed sample records: `npm run db:seed`
8. Start web app: `npm run dev:web`

## Tests
- Service/unit workflow tests: `npm run test:web`
- Prisma repository integration tests run as part of `npm run test:web` and require `TEST_DATABASE_URL` set to a disposable PostgreSQL database.
- Integration tests isolate each case in a temporary schema and clean up after execution.

## Seed login users
- `technician / technician123`
- `senior / senior123`
- `supervisor / supervisor123`
- `reviewer / reviewer123`
- `admin / admin123`
