# Commerce Ops Suite

Local-first internal operations dashboard for orders, reports, and users. The default local runtime is Docker Compose with Next.js, Postgres, Redis, and a worker process.

## Quick Start

1. Review `.env`.
2. Start the stack with `docker compose up --build`.
   If you use the standalone binary instead of the plugin, `docker-compose up --build` is equivalent.
3. Open `http://localhost:3000`.
4. Sign in with one of the seeded accounts below.

## Seeded Login

- Admin: `admin.local@example.com`
- Operations: `ops.local@example.com`
- Viewer: `viewer.local@example.com`
- Shared password: `LocalAdminPass123!`

## Useful Commands

- `npm run test`
- `npm run typecheck`
- `npm run build`
- `npm run smoke`
- `docker compose run --rm seed`
