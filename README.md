# Commerce Ops Suite

Local-first internal operations dashboard.

## Local Quick Start

1. Review `.env`.
2. Run `docker-compose up --build`.
3. Open `http://localhost:3000`.

## Database Tooling

- `npm run db:generate` creates SQL migrations from the Drizzle schema.
- `npm run db:migrate` applies Drizzle migrations to the database defined by `DATABASE_URL`.
- `npm run db:push` syncs the local schema to the database defined by `DATABASE_URL`.
- `npm run db:pull` introspects the current database shape.
- `npm run db:studio` opens Drizzle Studio against the local database.
- `docker-compose run --rm seed` reruns the local sample data load if you need to refresh users, reports, or demo orders.

## Seeded Credentials

- Admin: `admin.local@example.com`
- Operations: `ops.local@example.com`
- Viewer: `viewer.local@example.com`
- Shared password: `LocalAdminPass123!`

## Included Local Surface

- `migrate`, `seed`, `web`, `worker`, `postgres`, and `redis` run through Docker Compose.
- `/orders` provides server-rendered list, filters, detail, notes, and audit context.
- `/users` provides local access administration for admin users.
- `/reports` queues CSV export jobs for the worker to process.
- `/api/health`, `/api/ready`, and `/api/metrics` expose operational status.

## Smoke Check

- `npm run smoke` boots an isolated Docker Compose stack, verifies a seeded login plus report-worker flow, and tears the stack down automatically.
