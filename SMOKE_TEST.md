# Generated App Smoke Test

This repository includes an opt-in smoke test that validates a **generated application**, not just the generator unit tests.

## Commands

```bash
npm run test:smoke
npm run test:package-managers
```

Fast unit tests remain unchanged:

```bash
npm test
```

## Package manager install verification

`npm run test:package-managers` is a separate opt-in check that:

1. Generates a fresh base template app for each available manager (`pnpm`, `yarn`)
2. Runs that manager's install command through the same code path as the CLI
3. Verifies `node_modules` exists and `npm run typecheck` succeeds in the generated workspace

Managers not found on `PATH` are skipped with a message instead of failing the command.

Prerequisites:

- `pnpm` and/or `yarn` installed locally if you want both verified
- Network access for dependency installation

## What the smoke test does

1. Generates a fresh app from the current templates
2. Installs dependencies in the generated workspace
3. Starts PostgreSQL with Docker Compose
4. Runs migrations and seed data
5. Runs database tests
6. Runs server tests
7. Runs web tests
8. Optionally runs Playwright E2E when enabled

Cleanup runs in a `finally` block so Docker containers and temporary directories are removed even when a step fails.

## Local prerequisites

- Node.js 20+
- npm
- Docker Desktop or another Docker engine with the daemon running
- Port `5432` available on localhost for PostgreSQL
- Network access for `npm install` and Docker image pulls

Optional for E2E:

- Playwright browser dependencies on the host
- Additional time for Playwright install and dev-server startup

## Optional environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `SMOKE_RUN_E2E` | unset | Set to `1`, `true`, or `yes` to run Playwright after unit/integration layers |
| `SMOKE_KEEP_ARTIFACTS` | unset | Set to `1` to keep the generated workspace after the run for debugging |

Example with E2E enabled:

```bash
SMOKE_RUN_E2E=1 npm run test:smoke
```

## Expected runtime

The smoke test is intentionally separated from `npm test` because it:

- installs a full generated workspace
- starts Docker
- runs database, server, and web test suites

Expect several minutes on a typical laptop. Playwright adds more time when enabled.

## Failure troubleshooting

- **Docker daemon not running**: start Docker and rerun `npm run test:smoke`
- **Port 5432 already in use**: stop the conflicting PostgreSQL instance or free the port
- **Playwright failures**: rerun with `SMOKE_KEEP_ARTIFACTS=1`, inspect the generated workspace, and confirm browser dependencies are installed
