# __PROJECT_NAME__

A PostgreSQL-first starter for building applications with coding agents.

PostgreSQL owns business logic. The API layer stays thin. React renders contract data. Agent-facing documentation is included from the first commit.

## Quick start

```bash
cp .env.example .env
npm run db:up
npm run db:migrate
npm run db:seed
npm run test
npm run dev
```

Open `http://localhost:5173/sample-dashboard?projectId=00000000-0000-0000-0000-000000000010` to view the seeded demo dashboard.

## Start PostgreSQL

PostgreSQL runs locally through Docker Compose.

```bash
cp .env.example .env
npm run db:up
```

This starts PostgreSQL 16 on port `5432` using the credentials in `.env.example`.

Stop PostgreSQL when finished:

```bash
npm run db:down
```

## Run migrations

Apply SQL migrations after PostgreSQL is running:

```bash
npm run db:migrate
```

Migrations live in `db/migrations/` and create the `app` schema, error helpers, sample domain tables, and stored procedures.

## Seed data

Load demo data for local development and tests:

```bash
npm run db:seed
```

Seed scripts live in `db/seeds/demo.sql`.

## Run tests

Run the full test suite:

```bash
npm run test
```

Run layers individually:

```bash
npm run test:db
npm run test:server
npm run test:web
npm run test:e2e
```

Before server or database tests, ensure PostgreSQL is running, `.env` exists, and migrations plus seed have been applied.

This project uses **__DB_TEST_STYLE__**.

__DB_TEST_STYLE_DESCRIPTION__

## Start dev servers

```bash
npm run dev
```

This starts:

- API server on `http://localhost:3000`
- web app on `http://localhost:5173`

The web app proxies API requests during development.

## Architecture

- **PostgreSQL** — permissions, validations, state transitions, business metrics, and business-rule errors
- **Fastify API** — parse params, read actor context, call stored procedures, map database errors, return JSON
- **React** — render contract data from loaders and actions; no client-side business logic

### Architecture rules

- Business logic belongs in PostgreSQL stored procedures.
- API routes call `callProcedure` and map documented errors only.
- React renders fields returned by the API; it does not calculate permissions, status rules, or business metrics.

Read `AGENTS.md` and `DB_API_CONTRACT.md` before changing behavior.

## Repository layout

- `db/` — migrations, seeds, database tests, and scripts
- `server/` — thin Fastify API
- `web/` — React Router frontend
- `scripts/cursor-prompts/` — task-bounded Cursor prompts
- `scripts/checks/` — agent drift and contract coverage checks

## Use Cursor prompts

Prompt files live in `scripts/cursor-prompts/`.

Recommended flow:

1. `001-orientation.md` — read docs and summarize architecture without editing files
2. `002-plan-next-task.md` — choose the next task from `TASKS.md`
3. `003-implement-task.md` — implement one bounded task
4. `004-review-last-changes.md` — review against architecture rules
5. `006-add-db-procedure.md` through `009-add-e2e-flow.md` — extend specific layers

Paste a prompt into Cursor and ask the agent to follow it exactly. Each prompt defines files to read, scope limits, tests to run, and the summary format to return.

## Extension workflow

Follow this order when adding a feature:

1. Update `DB_API_CONTRACT.md` and `ERROR_CODES.md` if the contract changes.
2. Add or change PostgreSQL migrations and stored procedures in `db/`.
3. Add database tests in `db/tests/`.
4. Expose the procedure through a thin API route in `server/src/routes/`.
5. Add server tests in `server/tests/`.
6. Add or update a React route in `web/src/routes/`.
7. Add web tests and, when needed, a Playwright flow in `web/e2e/`.
8. Update `SCENARIOS.md` and `TASKS.md` when user-visible behavior changes.
9. Run `npm run agent:check` before finishing.

Work one task at a time from `TASKS.md`.

## Agent workflow

1. Read `AGENTS.md`, `TASKS.md`, `DB_API_CONTRACT.md`, `ERROR_CODES.md`, `SCENARIOS.md`, and `TESTING_STRATEGY.md`.
2. Use `scripts/cursor-prompts/001-orientation.md` for the first session.
3. Complete tasks in order and run the required tests for each task type.
4. Do not mark a task complete without test evidence.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start API and web dev servers |
| `npm run db:up` | Start PostgreSQL via Docker Compose |
| `npm run db:down` | Stop PostgreSQL |
| `npm run db:migrate` | Apply SQL migrations |
| `npm run db:seed` | Load demo seed data |
| `npm run test` | Run database, server, and web tests |
| `npm run test:db` | Run database tests only |
| `npm run test:server` | Run API tests only |
| `npm run test:web` | Run frontend tests only |
| `npm run test:e2e` | Run Playwright end-to-end tests |
| `npm run typecheck` | Type-check server and web workspaces |
| `npm run lint` | Alias for `npm run typecheck` (ESLint deferred post-v1) |
| `npm run agent:check` | Run agent drift checks |
| `npm run agent:check:contract` | Run contract coverage checks |

## When to use this

Use this starter when you want coding agents to extend a constrained, PostgreSQL-first architecture with explicit contracts and tests.

## When not to use this

Do not use this starter when you need production authentication, multi-tenant auth, ORM-heavy business logic in TypeScript, or deployment automation out of the box.
