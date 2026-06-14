# Correction Plan — __PROJECT_NAME__

Read these files first:

- `AGENTS.md`
- `DB_API_CONTRACT.md`
- `ERROR_CODES.md`
- `TESTING_STRATEGY.md`
- `TASKS.md`
- `SCENARIOS.md`

## Rules

- Do not implement code in this step.
- Produce the smallest correction plan that restores architecture boundaries.
- Business logic belongs in PostgreSQL.
- API routes are thin.
- React renders contract data.

## Your task

Given the described problem or review findings, produce a correction plan that includes:

1. what drift or defect was found
2. which layer owns the fix
3. allowed files to change
4. forbidden files to change
5. tests required to prove the fix
6. commands to run
7. acceptance criteria for the correction

## Completion summary

Stop after the correction plan and include:

1. files changed (should be none)
2. tests added (should be none)
3. commands run (should be none)
4. assumptions
5. recommended next task
