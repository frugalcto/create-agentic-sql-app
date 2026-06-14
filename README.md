# create-agentic-sql-app

A PostgreSQL-first starter for building applications with coding agents.

It generates a full-stack TypeScript application where PostgreSQL owns business logic, the API layer stays thin, React renders contract data, and agent-facing documentation is included from the first commit.

## Quick start

```bash
npx create-agentic-sql-app my-app
cd my-app
cp .env.example .env
npm run db:up
npm run db:migrate
npm run db:seed
npm run test
npm run dev
```

Generate with explicit options:

```bash
npx create-agentic-sql-app my-app --api fastify
npx create-agentic-sql-app my-app --db-tests pgtap
npx create-agentic-sql-app release-risk-demo --template release-risk
npx create-agentic-sql-app my-app --package-manager pnpm
npx create-agentic-sql-app my-app --skip-install --no-git
```

Run without flags to use the interactive prompt flow for project name, API framework, database test style, template, package manager, dependency installation, and git initialization.

Show built-in help or version:

```bash
npx create-agentic-sql-app --help
npx create-agentic-sql-app --version
```

## Architecture

The generator encodes a three-layer contract:

| Layer | Owns | Must not own |
| --- | --- | --- |
| **PostgreSQL** | Permissions, validations, state transitions, business metrics, risk scoring, business-rule errors, transactional behavior | HTTP concerns, UI rendering |
| **API (Express or Fastify)** | Parse params, read actor context, call stored procedures, map database errors, return JSON | Business rules, direct SQL in routes, permission checks |
| **React** | Render contract data, loaders, actions, loading/empty/error states | Business metrics, permission inference, status transition rules |

Generated projects also include agent docs (`AGENTS.md`, `DB_API_CONTRACT.md`, `ERROR_CODES.md`, `TASKS.md`, `SCENARIOS.md`, `TESTING_STRATEGY.md`) and a Cursor prompt library under `scripts/cursor-prompts/`.

## Generated structure

```
my-app/
  AGENTS.md
  DB_API_CONTRACT.md
  ERROR_CODES.md
  SCENARIOS.md
  TASKS.md
  TESTING_STRATEGY.md
  README.md
  docker-compose.yml
  db/
    migrations/
    seeds/
    tests/
    scripts/
  server/
    src/routes/
    tests/
  web/
    src/routes/
    tests/
    e2e/
  scripts/
    cursor-prompts/
    checks/
```

## Commands

### Generator CLI

| Argument / flag | Values | Default |
| --- | --- | --- |
| `[projectName]` | valid npm package name | prompted when omitted |
| `--api` | `express`, `fastify` | `express` |
| `--db-tests` | `integration`, `pgtap` | `integration` |
| `--template` | `base`, `release-risk` | `base` |
| `--package-manager` | `npm`, `pnpm`, `yarn` | auto-detected from `npm_config_user_agent`, then `pnpm-lock.yaml` / `yarn.lock` in the current directory, otherwise `npm` |
| `--skip-install` | — | install dependencies |
| `--no-git` | — | initialize git |
| `--help`, `-h` | — | show usage |
| `--version`, `-v` | — | show CLI version |

`projectName` must start with a letter or number and contain only letters, numbers, hyphens, underscores, or dots. Path separators and `..` are rejected.

### Generator development

| Command | Purpose |
| --- | --- |
| `npm install` | Install generator dependencies |
| `npm run build` | Build the CLI to `dist/` |
| `npm run typecheck` | Type-check the generator package |
| `npm test` | Run fast generator unit tests |
| `npm run test:smoke` | Opt-in end-to-end smoke test of a generated app (requires Docker) |
| `npm run test:package-managers` | Opt-in pnpm/yarn install verification for generated apps |

See `SMOKE_TEST.md` for smoke and package-manager verification prerequisites, including optional env vars `SMOKE_RUN_E2E` and `SMOKE_KEEP_ARTIFACTS`.

### Generated app

Root workspace scripts (identical across all generated templates):

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start API and web dev servers |
| `npm run db:up` | Start PostgreSQL via Docker Compose |
| `npm run db:down` | Stop Docker Compose services |
| `npm run db:migrate` | Apply SQL migrations |
| `npm run db:seed` | Load demo seed data |
| `npm run test` | Run database, server, and web tests |
| `npm run test:db` | Run database tests only |
| `npm run test:server` | Run API route tests only |
| `npm run test:web` | Run React unit tests only |
| `npm run test:e2e` | Run Playwright end-to-end tests |
| `npm run typecheck` | Type-check server and web workspaces |
| `npm run lint` | Alias for `typecheck` |
| `npm run agent:check` | Run agent drift checks |
| `npm run agent:check:contract` | Run contract coverage checks |

Workspace package scripts (run from `server/` or `web/` with `npm run <script>`, or from the root with `npm run <script> -w server` / `-w web`):

| Package | Command | Purpose |
| --- | --- | --- |
| `server` | `npm run dev` | Start API dev server with reload |
| `server` | `npm run test` | Run Vitest route tests |
| `server` | `npm run typecheck` | Type-check the API package |
| `web` | `npm run dev` | Start Vite dev server |
| `web` | `npm run test` | Run Vitest + Testing Library tests |
| `web` | `npm run test:e2e` | Run Playwright tests |
| `web` | `npm run test:e2e:install` | Install Playwright Chromium browser |
| `web` | `npm run typecheck` | Type-check the web package |

## Agent workflow

Use this flow after generating a project:

1. Open the generated project in Cursor.
2. Ask the agent to read `AGENTS.md`, `TASKS.md`, `DB_API_CONTRACT.md`, `ERROR_CODES.md`, `SCENARIOS.md`, and `TESTING_STRATEGY.md` without modifying files.
3. Start with `scripts/cursor-prompts/001-orientation.md`.
4. Work one task at a time from `TASKS.md`.
5. Run the required tests before marking a task complete.
6. Use task-specific prompts (`006-add-db-procedure.md`, `007-add-api-route.md`, `008-add-react-route.md`, `009-add-e2e-flow.md`) when extending the app.

Example first prompt in Cursor:

```
Read AGENTS.md, TASKS.md, DB_API_CONTRACT.md, ERROR_CODES.md, SCENARIOS.md, and TESTING_STRATEGY.md.
Do not modify files.
Summarize the architecture, task order, and first recommended task.
```

## Testing strategy

**Generator package**

- `npm test` — fast unit tests for CLI parsing, template copying, validation, and generation boundaries
- `npm run test:smoke` — slow, opt-in validation that a generated app can install dependencies, start PostgreSQL, migrate, seed, and pass database/server/web tests

**Generated app**

- Database tests — SQL integration tests or pgTAP, depending on `--db-tests`
- Server tests — Vitest + route tests against PostgreSQL procedures
- Web tests — Vitest + Testing Library for loaders, actions, and error states
- E2E tests — Playwright flows across web, API, and PostgreSQL

## When to use this

Use `create-agentic-sql-app` when you want:

- a PostgreSQL-first architecture from day one
- coding agents to work inside explicit contracts and task boundaries
- generated tests and documentation with the project
- a thin API and React UI that render database-owned business logic
- a repeatable workflow for extending features with Cursor prompts

## When not to use this

Version 1 intentionally excludes:

- authentication provider setup
- multi-tenant production auth
- complex ORM integration
- background workers
- deployment automation
- Kubernetes
- advanced visualizations
- AI agent orchestration
- code generation from DB contracts
- full OpenAPI generation

Do not use this generator if you need those capabilities out of the box. It is designed to prove architecture and agent workflow, not production platform completeness.

## Roadmap

| Phase | Status | Scope |
| --- | --- | --- |
| Generator skeleton | Done | CLI, validation, template copy, install, next steps |
| Base template | Done | Express, React Router, Docker Postgres, integration DB tests |
| Fastify support | Done | `--api fastify` |
| pgTAP support | Done | `--db-tests pgtap` |
| Release-risk template | Done | Flagship domain with PostgreSQL risk scoring |
| Interactive prompts | Done | Missing options prompt flow, git init |
| Generated app smoke test | Done | Opt-in `npm run test:smoke` |
| CI smoke workflow | Planned | Docker-backed smoke test in CI |
| Drift checker hardening | Planned | Stronger contract and coverage enforcement |

## License

MIT
