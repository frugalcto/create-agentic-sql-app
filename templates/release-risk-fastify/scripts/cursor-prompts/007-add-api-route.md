# Add API Route — __PROJECT_NAME__

Read these files first:

- `AGENTS.md`
- `contract/src/endpoints.ts`
- `contract/src/errors.ts`
- generated `DB_API_CONTRACT.md`
- `TESTING_STRATEGY.md`
- `TASKS.md`

## Rules

- Register the route through `registerEndpoint` in `server/src/routes/api.routes.ts`.
- The API route must be thin.
- Call a stored procedure through the contract binding.
- Map known database errors.
- Do not implement business logic.
- Do not validate business transitions in Fastify.
- Do not implement permission rules in Fastify.
- Do not invent response fields.

## Allowed files

- `contract/src/endpoints.ts`
- `contract/src/errors.ts`
- `server/src/routes/api.routes.ts`
- `server/src/contract/`
- `server/src/db/`
- `server/src/middleware/`
- `server/src/errors/`
- `server/tests/`

## Forbidden files

- `db/migrations/` unless the task explicitly includes database work
- `web/**`
- generated `DB_API_CONTRACT.md`, `ERROR_CODES.md`, and `contract/openapi.json`

## Required tests

- `npm run contract:generate` when contract files change
- `npm run test:server`
- affected `npm run test:db` when database behavior is involved

## Your task

Expose the documented stored procedure through the contract-driven Fastify route registry and add server tests for success and mapped error cases.

## Completion summary

Stop after completion and include:

1. files changed
2. tests added
3. commands run
4. assumptions
5. recommended next task
