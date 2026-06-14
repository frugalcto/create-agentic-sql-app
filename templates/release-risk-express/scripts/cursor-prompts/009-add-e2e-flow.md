# Add E2E Flow — __PROJECT_NAME__

Read these files first:

- `AGENTS.md`
- `DB_API_CONTRACT.md`
- `SCENARIOS.md`
- `TESTING_STRATEGY.md`
- `TASKS.md`

## Rules

- Add scenario-level coverage only.
- Do not replace DB/API/unit tests.
- Validate user-visible behavior through the real UI.
- Do not bypass the API.
- Do not encode business rules beyond expected user-visible outcomes.
- Use stable, accessible selectors.

## Allowed files

- `web/e2e/`
- `web/playwright.config.ts` only if required for the scenario
- `SCENARIOS.md`

## Forbidden files

- `db/**`
- `server/**`
- `web/src/**` unless a minimal accessible selector or test id is explicitly required

## Required tests

- `npm run test:e2e`

## Setup assumptions

The environment must already have:

- `npm run db:up`
- `npm run db:migrate`
- `npm run db:seed`

## Your task

Add or extend a Playwright flow for the requested scenario from `SCENARIOS.md`.

The test should prove the full DB/API/frontend path through normal UI interaction.

## Completion summary

Stop after completion and include:

1. files changed
2. tests added
3. commands run
4. assumptions
5. recommended next task
