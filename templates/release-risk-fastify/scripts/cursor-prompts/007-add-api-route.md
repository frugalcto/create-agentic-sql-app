# Add API Route — __PROJECT_NAME__

Read these files first:

- `AGENTS.md`
- `DB_API_CONTRACT.md`
- `ERROR_CODES.md`
- `TESTING_STRATEGY.md`
- `TASKS.md`

## Rules

- The API route must be thin.
- Call a stored procedure.
- Map known database errors.
- Do not implement business logic.
- Do not validate business transitions in Express.
- Do not implement permission rules in Express.
- Do not invent response fields.

## Allowed files

- `server/src/routes/`
- `server/src/db/`
- `server/src/middleware/`
- `server/src/errors/`
- `server/tests/`
- `DB_API_CONTRACT.md`
- `ERROR_CODES.md`

## Forbidden files

- `db/migrations/` unless the task explicitly includes database work
- `web/**`

## Required tests

- `npm run test:server`
- affected `npm run test:db` when database behavior is involved

## Your task

Expose the documented stored procedure through a thin Fastify route and add server tests for success and mapped error cases.

## Completion summary

Stop after completion and include:

1. files changed
2. tests added
3. commands run
4. assumptions
5. recommended next task
