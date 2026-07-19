# Add React Route — __PROJECT_NAME__

Read these files first:

- `AGENTS.md`
- `contract/src/endpoints.ts`
- generated `DB_API_CONTRACT.md`
- `ERROR_CODES.md`
- `TESTING_STRATEGY.md`
- `SCENARIOS.md`
- `TASKS.md`

## Rules

- React renders contract data.
- No permission inference.
- No business metric calculation.
- No status transition rules.
- Do not invent business fields.
- Do not duplicate database behavior.

## Allowed files

- `web/src/routes/`
- `web/src/components/`
- `web/src/api/` (import response types from `@__PROJECT_NAME_PKG__/contract` when possible)
- `web/tests/`
- `SCENARIOS.md` when user-visible behavior changes

## Forbidden files

- `db/**`
- `server/**` unless the task explicitly includes API work

## Required tests

- `npm run test:web`
- affected server or database tests only if the task explicitly includes them

## Your task

Add or update the documented React route so it loads and mutates contract data through the API using loaders and actions.

Show loading, empty, success, and API error states without client-side business logic.

## Completion summary

Stop after completion and include:

1. files changed
2. tests added
3. commands run
4. assumptions
5. recommended next task
