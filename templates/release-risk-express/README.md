# __PROJECT_NAME__

A PostgreSQL-first starter for building applications with coding agents.

PostgreSQL owns business logic. The API layer stays thin. React renders contract data. Agent-facing documentation is included from the first commit.

This project uses the **release-risk** template: services, releases, pull requests, incidents, support tickets, and PostgreSQL-computed release risk scoring.

## Quick start

```bash
cp .env.example .env
npm run db:up
npm run db:migrate
npm run db:seed
npm run test
npm run dev
```

Open `http://localhost:5173/release-risk-dashboard?serviceId=00000000-0000-0000-0000-000000000010` to view seeded release risk data for **Checkout API**.

## Public demo walkthrough

After `npm run dev`:

1. Open the home page at `http://localhost:5173/`.
2. Click **Open release risk dashboard**.
3. Review service **Checkout API**, release **Checkout reliability release**, and PostgreSQL-computed risk fields.
4. Click **Approve** to run the documented happy-path transition.
5. Use **Demo controls (development only)** to switch actor context, open the empty service dashboard, or trigger documented error states.

Risk scores and release transitions are enforced in PostgreSQL. React renders returned contract data only.

### Files to inspect

| Area | Path |
| --- | --- |
| Stored procedures | `db/migrations/004_release_risk_procedures.sql` |
| Seed story | `db/seeds/demo.sql` |
| Contract module | `contract/src/endpoints.ts`, `contract/src/errors.ts` |
| API route registry | `server/src/routes/api.routes.ts` |
| React route | `web/src/routes/release-risk-dashboard.tsx` |
| Agent rules | `AGENTS.md` |
| Generated contracts | `DB_API_CONTRACT.md`, `ERROR_CODES.md`, `contract/openapi.json` |
| Validation | `TESTING_STRATEGY.md`, `SCENARIOS.md` |
| Screenshot guidance | `docs/screenshots/README.md` |

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

Migrations live in `db/migrations/` and create the `app` schema, release-risk domain tables, and stored procedures including `app_calculate_release_risk`.

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

- **PostgreSQL** — permissions, validations, state transitions, risk scoring, and business-rule errors
- **Express API** — validate inputs against the contract, call stored procedures, map database errors, return JSON
- **React** — render contract data from loaders and actions; no client-side business logic

### Architecture rules

- Risk scores and release transitions belong in PostgreSQL stored procedures.
- API routes register through `registerEndpoint` and delegate to PostgreSQL; they do not implement business rules.
- React renders `riskScore`, `riskLevel`, and status fields returned by the API; it does not calculate risk locally.

Read `AGENTS.md` and `contract/src/` before changing behavior. Generated `DB_API_CONTRACT.md` and `ERROR_CODES.md` are produced from the contract module.

## Machine-readable contract

This project keeps the HTTP-to-database boundary in a typed **contract module** instead of hand-synchronized markdown, TypeScript types, and route code.

### Source of truth

| Location | Purpose |
| --- | --- |
| `contract/src/endpoints.ts` | Route definitions: method, path, Zod input/response schemas, procedure bindings, error codes |
| `contract/src/errors.ts` | Error registry: PostgreSQL code → HTTP status, category, display message |
| `contract/src/schema.ts` | Shared contract types and `defineEndpoint` helper |

The `contract/` folder is an npm workspace package (`@__PROJECT_NAME_PKG__/contract`). The server, web app, and check scripts all import from it, so TypeScript catches drift at compile time.

### Generated artifacts

Run `npm run contract:generate` after editing the contract module. It writes:

- `DB_API_CONTRACT.md` — human-readable route-to-procedure reference for agents
- `ERROR_CODES.md` — error catalog for API and UI behavior
- `contract/openapi.json` — OpenAPI 3.1 export of endpoints and error responses

These files include a generated header. **Do not edit them by hand.** Change `contract/src/` and regenerate.

### How routes use the contract

All API routes register in `server/src/routes/api.routes.ts` through `registerEndpoint`. For each endpoint the wrapper:

1. Validates query, path, and body params with Zod (unknown fields are rejected)
2. Binds HTTP inputs to procedure arguments in the order declared in the contract
3. Calls the PostgreSQL stored procedure via `callProcedure`
4. In development and tests, validates the procedure JSON response against the contract schema

The web client imports response types from the contract package (`z.infer`), so frontend types stay aligned with API responses.

Internal procedures such as `app_calculate_release_risk` are listed in `contract/src/errors.ts` as `INTERNAL_PROCEDURES` so they are not exposed as HTTP endpoints but are still verified against the database.

### Verification commands

| Command | What it checks |
| --- | --- |
| `npm run contract:generate` | Regenerates markdown and OpenAPI from `contract/src/` |
| `npm run agent:check` | Contract freshness, endpoint registration, SQL error coverage, and business-logic drift heuristics |
| `npm run agent:check:contract` | Contract coverage only (errors, DB tests, route registration) |
| `npm run agent:check:db` | Live PostgreSQL procedure signatures and raised error codes match the contract |

`npm run test:db` also runs the database contract verifier after SQL tests pass.

### When to update the contract

Edit the contract module when you add or change:

- an HTTP route or its inputs
- a stored procedure binding or parameter order
- a response JSON shape exposed to the API
- a business error code

Typical flow:

```bash
# 1. Edit contract/src/endpoints.ts and/or contract/src/errors.ts
# 2. Regenerate docs
npm run contract:generate
# 3. Add migration, procedure, and database tests
# 4. Register the endpoint in server/src/routes/api.routes.ts
# 5. Add server and web tests
npm run agent:check
```

## Repository layout

- `contract/` — typed contract package (endpoints, errors, generated OpenAPI)
- `db/` — migrations, seeds, database tests, and scripts
- `server/` — thin Express API with contract-driven route registration
- `web/` — React Router frontend
- `scripts/contract/` — contract generation and database verification scripts
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

1. Update `contract/src/endpoints.ts` and/or `contract/src/errors.ts`, then run `npm run contract:generate`.
2. Add or change PostgreSQL migrations and stored procedures in `db/`.
3. Add database tests in `db/tests/`.
4. Register the endpoint in `server/src/routes/api.routes.ts`.
5. Add server tests in `server/tests/`.
6. Add or update a React route in `web/src/routes/`.
7. Add web tests and, when needed, a Playwright flow in `web/e2e/`.
8. Update `SCENARIOS.md` and `TASKS.md` when user-visible behavior changes.
9. Run `npm run agent:check` before finishing.

Work one task at a time from `TASKS.md`.

## Agent workflow

1. Read `AGENTS.md`, `contract/src/`, generated `DB_API_CONTRACT.md`, `ERROR_CODES.md`, `SCENARIOS.md`, `TASKS.md`, and `TESTING_STRATEGY.md`.
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
| `npm run typecheck` | Type-check contract, server, and web workspaces |
| `npm run lint` | Alias for `npm run typecheck` (ESLint deferred post-v1) |
| `npm run contract:generate` | Regenerate contract markdown and OpenAPI from `contract/src/` |
| `npm run agent:check` | Run contract freshness, drift, and coverage checks |
| `npm run agent:check:contract` | Run contract coverage checks only |
| `npm run agent:check:db` | Verify live PostgreSQL procedures match the contract |

## When to use this

Use this starter when you want coding agents to extend a PostgreSQL-first release-risk domain with explicit contracts, database-owned risk scoring, and generated tests.

## When not to use this

Do not use this starter when you need production authentication, multi-tenant auth, ORM-heavy business logic in TypeScript, or deployment automation out of the box.
