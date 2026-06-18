# Tasks — __PROJECT_NAME__

Work one task at a time. Read `AGENTS.md`, `DB_API_CONTRACT.md`, `ERROR_CODES.md`, and `TESTING_STRATEGY.md` before starting.

---

## TASK-001 Repository generated

**Goal:** Confirm the generated repository is present and agent documentation is available.

**Files:**
- root documentation files
- `package.json`
- `docker-compose.yml`

**Requirements:**
- Repository structure matches the generated layout
- Agent docs exist and describe architecture boundaries

**Acceptance criteria:**
- Project installs dependencies
- Documentation files are readable in the repo root

**Testing requirements:**
- None beyond confirming generation completed

**Architecture rules:**
- Business logic belongs in PostgreSQL
- API routes are thin
- React renders contract data

**Suggested Cursor prompt:**
Read `AGENTS.md` and `TASKS.md`. Summarize architecture rules and recommend the next task.

---

## TASK-002 Confirm Docker/PostgreSQL startup

**Goal:** Verify local PostgreSQL starts through Docker Compose.

**Files:**
- `docker-compose.yml`
- `.env`

**Requirements:**
- Copy `.env.example` to `.env`
- Start PostgreSQL with `npm run db:up`

**Acceptance criteria:**
- PostgreSQL container is running
- Database accepts connections on port `5432`

**Testing requirements:**
- Manual verification or successful connection using `DATABASE_URL`

**Architecture rules:**
- Database is the system of record

**Suggested Cursor prompt:**
Confirm Docker Compose starts PostgreSQL for this project and report the connection details.

---

## TASK-003 Confirm migrations and seed

**Goal:** Apply migrations and load demo seed data.

**Files:**
- `db/migrations/`
- `db/seeds/demo.sql`
- `db/scripts/migrate.ts`
- `db/scripts/seed.ts`

**Requirements:**
- Run `npm run db:migrate`
- Run `npm run db:seed`

**Acceptance criteria:**
- Schemas and tables exist
- Demo users, projects, and release items are present

**Testing requirements:**
- `npm run test:db` passes after migrations and seed

**Architecture rules:**
- Domain tables and procedures live in PostgreSQL

**Suggested Cursor prompt:**
Run migrations and seed, then confirm the sample domain data exists.

---

## TASK-004 Confirm health route

**Goal:** Verify the health API route calls the database health procedure.

**Files:**
- `server/src/routes/health.routes.ts`
- `db/migrations/004_sample_procedures.sql`

**Requirements:**
- `GET /api/health` returns `{ "status": "ok" }`

**Acceptance criteria:**
- Health route responds successfully against a running database

**Testing requirements:**
- `npm run test:server` includes health route coverage

**Architecture rules:**
- Route calls `app.app_health_check()` only

**Suggested Cursor prompt:**
Confirm `GET /api/health` works and uses the PostgreSQL health procedure.

---

## TASK-005 Implement new stored procedure

**Goal:** Add a new PostgreSQL stored procedure for a documented business behavior.

**Files:**
- `db/migrations/`
- `db/tests/`
- `DB_API_CONTRACT.md`
- `ERROR_CODES.md`

**Requirements:**
- Implement only the requested procedure
- Raise only documented error codes
- Add database tests

**Acceptance criteria:**
- Procedure behavior matches the contract
- Database tests cover success and failure paths

**Testing requirements:**
- `npm run test:db`

**Architecture rules:**
- Permissions, validations, and transitions belong in PostgreSQL
- Do not modify API or React files in this task

**Suggested Cursor prompt:**
Use `scripts/cursor-prompts/006-add-db-procedure.md` if available. Implement only the requested PostgreSQL procedure and database tests.

---

## TASK-006 Expose procedure through API

**Goal:** Add or update a thin Express route for a documented stored procedure.

**Files:**
- `server/src/routes/`
- `server/src/db/callProcedure.ts`
- `server/src/errors/`
- `DB_API_CONTRACT.md`

**Requirements:**
- Route maps to the documented procedure and parameters
- Database errors map to documented API payloads

**Acceptance criteria:**
- Route returns procedure JSON on success
- Documented errors return correct HTTP status codes

**Testing requirements:**
- `npm run test:server`

**Architecture rules:**
- Route parses params, reads actor context, calls procedure, maps errors
- No business logic in Express

**Suggested Cursor prompt:**
Use `scripts/cursor-prompts/007-add-api-route.md` if available. Expose the documented procedure through a thin API route.

---

## TASK-007 Add React route

**Goal:** Add or update a React Router route that renders contract data from the API.

**Files:**
- `web/src/routes/`
- `web/src/components/`
- `DB_API_CONTRACT.md`

**Requirements:**
- Loader/action calls documented API routes
- UI renders API fields without client-side business logic

**Acceptance criteria:**
- Route shows loading, empty, success, and error states
- No permission or status inference in React

**Testing requirements:**
- `npm run test:web`

**Architecture rules:**
- React renders contract data only

**Suggested Cursor prompt:**
Use `scripts/cursor-prompts/008-add-react-route.md` if available. Add the documented React route and tests.

---

## TASK-008 Add E2E scenario

**Goal:** Add or extend a Playwright flow for a documented user scenario.

**Files:**
- `web/e2e/`
- `SCENARIOS.md`

**Requirements:**
- Cover the requested scenario end to end
- Use seeded demo data and documented API behavior

**Acceptance criteria:**
- Playwright flow passes against a running app and database

**Testing requirements:**
- `npm run test:e2e`

**Architecture rules:**
- E2E validates user-visible contract behavior, not reimplemented business rules

**Suggested Cursor prompt:**
Use `scripts/cursor-prompts/009-add-e2e-flow.md` if available. Add the documented end-to-end scenario.

---

## TASK-009 Polish public demo

**Goal:** Confirm the generated app is ready for a short public proof-of-concept demo.

**Files:**
- `db/seeds/demo.sql`
- `web/src/routes/`
- `README.md`
- `SCENARIOS.md`
- `docs/screenshots/README.md`

**Requirements:**
- Seed data tells a coherent story with realistic names
- Home and dashboard copy explain the PostgreSQL-first architecture accurately
- Demo controls use documented API actor context and error paths only

**Acceptance criteria:**
- README explains what to run, what to click, and what to inspect
- Dashboard, empty, permission, and invalid-transition states are visible or documented
- Tests pass for updated seed data and copy

**Testing requirements:**
- `npm run test`
- `npm run test:e2e` when the demo flow is affected

**Architecture rules:**
- React renders contract data only
- Demo aids must not fabricate business behavior in the frontend

**Suggested Cursor prompt:**
Review the public demo walkthrough in `README.md` and verify the seeded story matches `SCENARIOS.md`.
