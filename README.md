# Commerce Ops Suite

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169e1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ed?logo=docker&logoColor=white)
![Tests](https://img.shields.io/badge/Vitest-covered-6e9f18?logo=vitest&logoColor=white)

Commerce Ops Suite is a local-first internal operations dashboard for commerce teams that need one place to manage order workflows, queue operational reports, control user access, and inspect audit history.

The project is built as a full-stack portfolio application, not a static UI mockup. It runs end-to-end with Next.js, PostgreSQL, Redis, a background worker, database migrations, seeded users, role-based permissions, health/readiness/metrics endpoints, and automated test coverage.

## What This Demonstrates

- Full-stack product thinking: authenticated workspaces, workflow state, reporting, admin controls, audit trails, and operational probes are modeled together.
- Production-shaped local runtime: Docker Compose starts the web app, worker, PostgreSQL, Redis, migrations, and seed data without requiring cloud services.
- Server-first Next.js architecture: App Router pages, server actions, route handlers, typed repositories, and reusable UI primitives.
- Data ownership discipline: PostgreSQL is the durable source of truth; Redis is treated as support infrastructure.
- Recruiter-friendly engineering evidence: 24 unit tests, smoke automation, CI workflow, typed environment validation, and a documented AWS migration path.

## Table of Contents

- [Product Tour](#product-tour)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Data Model](#data-model)
- [Getting Started](#getting-started)
- [Demo Accounts](#demo-accounts)
- [Useful Commands](#useful-commands)
- [Quality Gates](#quality-gates)
- [Project Structure](#project-structure)
- [Operational Endpoints](#operational-endpoints)
- [Cloud Migration Path](#cloud-migration-path)
- [README Sources](#readme-sources)

## Product Tour

### Orders Workspace

The orders workspace is the primary operator queue. Users can filter by lifecycle status, search by order ID or team, inspect queue metrics, paginate through work, and open an order detail page.

Supported order states:

- `pending_review`
- `processing`
- `shipped`
- `cancelled`

### Order Detail Workflow

Each order detail page includes the current state, assigned team, allowed next transitions, operator notes, status history, and audit events. Users with write permissions can update the order status and attach handoff notes; read-only users can inspect the workflow without mutating it.

### Reports Queue

The reports workspace lets operators queue CSV export jobs from report definitions. Jobs are stored in PostgreSQL, picked up by the worker process, processed against the current order dataset, and written back with artifact metadata and previewable CSV content.

### Users And Access Control

Admins can view the local user roster, update roles, disable or reactivate users, and inspect recent privileged access changes. Role permissions are intentionally small and explicit:

| Role         | Permissions                                         |
| ------------ | --------------------------------------------------- |
| `admin`      | Read/update orders, read/update users, read reports |
| `operations` | Read/update orders, read reports                    |
| `viewer`     | Read orders, read reports                           |

### Audit History

Important workflow and access-control events are written to `audit_logs`. Order detail pages show target-specific audit entries, while the users workspace surfaces recent user-management events.

## Architecture

```mermaid
flowchart LR
  Browser[Operator Browser] --> Web[Next.js Web App]
  Web --> Postgres[(PostgreSQL)]
  Web --> Redis[(Redis)]
  Web --> Reports[Report Job Queue]
  Reports --> Postgres
  Worker[Worker Process] --> Postgres
  Worker --> Reports
  Worker --> Audit[Audit Logs]
  Audit --> Postgres
```

Runtime services:

| Service    | Responsibility                                                                              |
| ---------- | ------------------------------------------------------------------------------------------- |
| `web`      | Next.js application, authenticated pages, server actions, API route handlers                |
| `worker`   | Polls report jobs, builds CSV artifacts, records report completion audit entries            |
| `postgres` | Durable data store for users, sessions, roles, orders, reports, jobs, notes, and audit logs |
| `redis`    | Local support cache and coordination service                                                |
| `migrate`  | Runs Drizzle migrations before the app starts                                               |
| `seed`     | Creates demo users, roles, reports, and orders                                              |

## Tech Stack

| Layer      | Tools                                                                         |
| ---------- | ----------------------------------------------------------------------------- |
| Framework  | Next.js 16 App Router, React 19                                               |
| Language   | TypeScript 6                                                                  |
| Styling    | Tailwind CSS 4, shadcn-style UI primitives, Radix UI, Lucide icons            |
| Database   | PostgreSQL 17, Drizzle ORM, Drizzle Kit migrations                            |
| Runtime    | Node.js 20, Docker Compose                                                    |
| Worker     | `tsx` background process polling report jobs                                  |
| Auth       | Local seeded users, bcrypt password hashing, HTTP-only session cookie storage |
| Validation | Zod environment parsing                                                       |
| Quality    | ESLint, Prettier, TypeScript, Vitest, smoke script, GitHub Actions            |

## Data Model

Core tables:

- `roles`: named role definitions.
- `users`: local operator accounts, active state, role assignment, password hash.
- `sessions`: hashed session tokens with expiration.
- `orders`: operational order queue.
- `order_status_history`: immutable status transition history.
- `order_notes`: operator handoff notes.
- `reports`: report definitions available in the UI.
- `report_jobs`: queued export jobs, job status, filters, artifact content.
- `audit_logs`: cross-workspace audit events.

## Getting Started

### Prerequisites

- Node.js 20 or newer
- npm
- Docker with Docker Compose, or the standalone `docker-compose` binary

### 1. Configure Environment

The repository includes `.env.example`. For local development, create `.env` with the same keys:

```bash
cp .env.example .env
```

Default local values:

```dotenv
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://ops_app:ops_app@localhost:5432/ops_dashboard
REDIS_URL=redis://localhost:6379
SESSION_SECRET=change-me-in-local
SESSION_COOKIE_NAME=commerce_ops_session
LOCAL_ADMIN_EMAIL=admin.local@example.com
LOCAL_ADMIN_PASSWORD=LocalAdminPass123!
APP_BASE_URL=http://localhost:3000
```

### 2. Start The Full Local Stack

```bash
docker compose up --build
```

If your machine uses the standalone Compose binary:

```bash
docker-compose up --build
```

Compose starts PostgreSQL, Redis, database migrations, seed data, the Next.js web app, and the worker process.

### 3. Open The App

Visit:

```text
http://localhost:3000
```

Sign in with one of the seeded accounts below.

## Demo Accounts

| Role       | Email                      | Password             |
| ---------- | -------------------------- | -------------------- |
| Admin      | `admin.local@example.com`  | `LocalAdminPass123!` |
| Operations | `ops.local@example.com`    | `LocalAdminPass123!` |
| Viewer     | `viewer.local@example.com` | `LocalAdminPass123!` |

## Useful Commands

| Command                | Purpose                                                                |
| ---------------------- | ---------------------------------------------------------------------- |
| `npm run dev`          | Run the Next.js app locally outside Compose                            |
| `npm run worker`       | Run the report worker outside Compose                                  |
| `npm run db:migrate`   | Apply Drizzle migrations                                               |
| `npm run db:generate`  | Generate a new Drizzle migration                                       |
| `npm run db:studio`    | Open Drizzle Studio                                                    |
| `npm run seed`         | Seed local users, reports, and sample orders                           |
| `npm run lint`         | Run ESLint with zero-warning enforcement                               |
| `npm run typecheck`    | Run TypeScript without emitting files                                  |
| `npm run test`         | Run the Vitest suite                                                   |
| `npm run smoke`        | Boot an isolated Compose stack and verify auth plus report worker flow |
| `npm run build`        | Build the Next.js app                                                  |
| `npm run format:check` | Check Prettier formatting                                              |
| `make up`              | Start the Compose stack with build                                     |
| `make down`            | Stop Compose services and remove orphans                               |

## Quality Gates

The repository includes a GitHub Actions workflow that runs:

- `npm ci`
- `npm run format:check`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

The local test suite currently includes 24 unit test files covering auth/session behavior, RBAC, repositories, pagination, filtering, reports, audit behavior, UI presenters, status badges, layout components, environment validation, and smoke-script helpers.

For end-to-end confidence, `npm run smoke` creates an isolated Compose project on free local ports, waits for readiness, verifies protected-route redirects, signs in with the seeded admin, queues a report job, waits for worker completion, checks the report page, then tears the stack down.

## Project Structure

```text
.
├── app/                     # Next.js App Router pages, layouts, actions, and API routes
├── src/components/          # Reusable UI and workspace components
├── src/db/                  # Drizzle schema
├── src/lib/                 # Environment, database, presenter, timestamp, and utility helpers
├── src/modules/             # Domain modules: auth, audit, orders, RBAC, reports, users
├── src/worker/              # Background report processor
├── scripts/                 # Seed and smoke-test automation
├── tests/unit/              # Vitest unit tests
├── drizzle/                 # Database migrations and snapshots
├── docker/                  # Postgres and Redis local configuration
├── docs/                    # Architecture, AWS migration, and research notes
├── docker-compose.yml       # Full local runtime
└── .github/workflows/ci.yml # CI quality gate
```

## Operational Endpoints

| Endpoint       | Purpose                                                      |
| -------------- | ------------------------------------------------------------ |
| `/api/health`  | Liveness check with database status                          |
| `/api/ready`   | Readiness check for runtime dependency availability          |
| `/api/metrics` | Prometheus-style counters for orders, users, and report jobs |

## Cloud Migration Path

The project is intentionally local-first, but the runtime boundaries map cleanly to AWS:

| Local Service           | AWS Target                                                  |
| ----------------------- | ----------------------------------------------------------- |
| `web`                   | ECS/Fargate service behind a reverse proxy or load balancer |
| `worker`                | Separate ECS/Fargate service                                |
| `postgres`              | Amazon RDS for PostgreSQL                                   |
| `redis`                 | Amazon ElastiCache                                          |
| Future report artifacts | Amazon S3                                                   |

Local behavior should remain the source of product truth; cloud migration should change infrastructure bindings, not application behavior.

## README Sources

This README follows current public guidance that a strong project front page should explain why the project is useful, how to run it, what it does, and how contributors or reviewers can evaluate it:

- [GitHub Docs: About READMEs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes)
- [Open Source Guides: Starting an Open Source Project](https://opensource.guide/starting-a-project/)
- [Make a README](https://www.makeareadme.com/)

## License

No open-source license is currently declared in this repository.
