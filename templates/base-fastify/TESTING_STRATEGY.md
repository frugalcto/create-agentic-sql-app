# Testing Strategy — __PROJECT_NAME__

## Philosophy

Tests protect the contract between PostgreSQL, the API, and React. Database behavior is the source of truth, so database tests come first.

Database test style for this project: **__DB_TEST_STYLE__**.

__DB_TEST_STYLE_DESCRIPTION__

## Test layers

1. **Database tests** — stored procedures, permissions, transitions, and error codes
2. **Server tests** — thin route wiring and error mapping
3. **Web tests** — route loaders/actions and UI states
4. **E2E tests** — documented user flows across the full stack

## Required commands

```bash
npm run test:db
npm run test:server
npm run test:web
npm run test:e2e
npm run test
npm run typecheck
```

Database setup commands used before tests in local development:

```bash
npm run db:up
npm run db:migrate
npm run db:seed
```

## Task completion rule

A task is not complete until:

1. acceptance criteria in `TASKS.md` are met
2. required tests for that task type pass
3. contract docs are updated when behavior changes
4. the agent summary lists files changed, tests run, and assumptions

## Testing by task type

| Task type | Required tests |
| --- | --- |
| Database procedure | `npm run test:db` |
| API route | `npm run test:server` and affected `npm run test:db` |
| React route | `npm run test:web` and affected server/database tests |
| End-to-end scenario | `npm run test:e2e` |
| Documentation-only | no tests required unless commands or contracts changed |

## Expected base coverage

Database tests should cover:

- health procedure returns ok
- sample dashboard denies unauthorized user
- sample dashboard returns expected JSON shape
- valid release transition succeeds
- invalid release transition raises `RELEASE_INVALID_TRANSITION`
- viewer cannot transition release

Server tests should cover:

- `GET /api/health` returns ok
- `GET /api/sample-dashboard` returns procedure JSON
- permission error maps to `403`
- invalid transition maps to `400`

Web tests should cover:

- sample dashboard renders loaded data
- sample dashboard renders API error state
- release transition action submits expected payload

E2E tests should cover:

- open sample dashboard
- see seeded project and release
- approve release
- see updated release status

## Agent rule

Do not mark a task complete without running the required commands and reporting the results in the task summary.
