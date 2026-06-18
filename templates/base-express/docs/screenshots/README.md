# Screenshot guidance

Use this folder to store launch screenshots for the generated app. Do not commit screenshots unless your project already has an established screenshot process.

## Before capturing

1. Run `npm run db:up`, `npm run db:migrate`, and `npm run db:seed`.
2. Run `npm run dev`.
3. Open `http://localhost:5173/`.

## Recommended captures

### Dashboard loaded state

- Route: `/sample-dashboard?projectId=00000000-0000-0000-0000-000000000010`
- Show project **Agentic SQL Demo**, release **Initial contract-driven release**, and the approve action.

### Permission error state

- Open the dashboard with viewer context:
  `?projectId=00000000-0000-0000-0000-000000000010&demoUserId=00000000-0000-0000-0000-000000000002`
- Click **Approve** and capture the API error message.

### Invalid transition error state

- As owner, click **Try invalid transition (demo)** on a draft release.
- Capture the documented business-rule error near the action.

### Empty state

- Route: `/sample-dashboard?projectId=00000000-0000-0000-0000-000000000011`
- Show the empty project dashboard for **Empty rollout project**.

### Test output

- Run `npm run test` or `npm run test:web`.
- Capture terminal output showing database, server, and web tests passing.

### Architecture documentation

- Capture `AGENTS.md` or `DB_API_CONTRACT.md` sections that show PostgreSQL-first boundaries.

### System error state

- Stop the API server while keeping the web app open.
- Reload the dashboard and capture the generic error state.

## Naming convention

Use descriptive filenames such as:

- `dashboard-loaded.png`
- `permission-denied.png`
- `invalid-transition.png`
- `empty-state.png`
- `test-output.png`
- `architecture-docs.png`
