# Review Last Changes — __PROJECT_NAME__

Read these files first:

- `AGENTS.md`
- `DB_API_CONTRACT.md`
- `ERROR_CODES.md`
- `TESTING_STRATEGY.md`
- `TASKS.md`

## Rules

- Review only the most recent task-related changes.
- Check architecture boundaries before suggesting more work.
- Business logic belongs in PostgreSQL.
- API routes are thin.
- React renders contract data.

## Your task

Review the last changes and report:

1. whether PostgreSQL, API, and React responsibilities were respected
2. whether contract docs match the code
3. whether required tests were added or updated
4. any architecture drift or anti-patterns
5. any missing tests or documentation

Do not make new changes unless a clear defect must be fixed to satisfy the reviewed task.

## Completion summary

Stop after the review and include:

1. files changed
2. tests added
3. commands run
4. assumptions
5. recommended next task
