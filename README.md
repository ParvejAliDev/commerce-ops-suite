# Commerce Ops Suite

Local-first internal operations dashboard.

## Local Quick Start

1. Review `.env`.
2. Run `docker compose up --build`.
3. Run `npm run seed`.
4. Open `http://localhost:3000`.

## Seeded Credentials

- Admin: `admin.local@example.com`
- Operations: `ops.local@example.com`
- Viewer: `viewer.local@example.com`
- Shared password: `LocalAdminPass123!`

## Included Local Surface

- `web`, `worker`, `postgres`, and `redis` run through Docker Compose.
- `/orders` provides server-rendered list, filters, detail, notes, and audit context.
- `/users` provides local access administration for admin users.
- `/reports` queues CSV export jobs for the worker to process.
- `/api/health`, `/api/ready`, and `/api/metrics` expose operational status.
