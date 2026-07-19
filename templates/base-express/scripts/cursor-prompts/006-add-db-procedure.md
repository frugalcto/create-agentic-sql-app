# Add Database Procedure — __PROJECT_NAME__

Read these files first:

- `AGENTS.md`
- `DB_API_CONTRACT.md`
- `ERROR_CODES.md`
- `TESTING_STRATEGY.md`
- `TASKS.md`

## Rules

- Implement only the requested PostgreSQL procedure.
- Permissions belong in PostgreSQL.
- Validations belong in PostgreSQL.
- State transitions belong in PostgreSQL.
- Raise only documented app error codes.
- Add database tests.
- Do not modify API routes.
- Do not modify React files.

## Allowed files

- `db/migrations/`
- `db/tests/`
- `db/seeds/` only if required for test data
- `contract/src/errors.ts` when adding new error codes
- `contract/src/endpoints.ts` when exposing the procedure through HTTP
- `SCENARIOS.md` when user-visible behavior changes

After contract edits, run `npm run contract:generate`.

## Forbidden files

- `server/**`
- `web/**`
- generated `DB_API_CONTRACT.md`, `ERROR_CODES.md`, and `contract/openapi.json`

## Required tests

- `npm run test:db`

## Your task

Implement only the requested stored procedure and its database tests.

Update contract docs in the same change if the procedure is part of the public contract:

1. update `contract/src/endpoints.ts` and/or `contract/src/errors.ts`
2. run `npm run contract:generate`

## Completion summary

Stop after completion and include:

1. files changed
2. tests added
3. commands run
4. assumptions
5. recommended next task
