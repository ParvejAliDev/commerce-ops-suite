# Commerce Ops Suite

## Local Quick Start

1. Review `.env` and adjust values if needed.
2. Run `docker compose up --build` for the full stack.
3. Open `http://localhost:3000`.
4. Use `npm run dev` outside Docker if you want a faster frontend iteration loop while keeping the dependencies containerized.

## Included Surface

- Dockerized `web`, `worker`, `postgres`, and `redis`
- Health endpoint at `/api/health`
- Environment contract with validation
- Worker process scaffold
