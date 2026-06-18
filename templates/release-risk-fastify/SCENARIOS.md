# Scenarios — __PROJECT_NAME__

These scenarios define expected behavior for the release-risk domain. Implementations must keep business logic in PostgreSQL and render contract data in React.

## Happy path

1. Actor is a service owner with access to the seeded service **Checkout API**.
2. User opens `/release-risk-dashboard?serviceId=<seeded-service-id>`.
3. Loader calls `GET /api/release-risk-dashboard`.
4. Dashboard renders service summary, release items, and PostgreSQL-computed risk fields for **Checkout reliability release**.
5. User approves a draft release.
6. Action calls `POST /api/releases/:releaseId/transition` with `{ "targetStatus": "approved" }`.
7. UI shows the updated release status returned by the API.

## Permission denied

1. Actor is a viewer without transition permission.
2. User opens the release risk dashboard for a service they can view.
3. Dashboard loads successfully with risk data from PostgreSQL.
4. User attempts to transition a release.
5. API returns `403` with `PERMISSION_DENIED`.
6. UI shows the API error state and does not update business fields locally.

## Invalid transition

1. Actor is a service owner.
2. User attempts to move a release from `draft` directly to `released`.
3. PostgreSQL raises `RELEASE_INVALID_TRANSITION`.
4. API returns `400` with the documented payload.
5. UI shows the error near the action and keeps existing dashboard data.

## Not found

1. Actor requests a dashboard for a service that does not exist.
2. PostgreSQL raises `SERVICE_NOT_FOUND`.
3. API returns the documented not-found behavior.
4. UI shows the appropriate empty or error state without inventing fallback business data.

## Empty state

1. Actor has access to a valid service with no releases.
2. Loader calls `GET /api/release-risk-dashboard`.
3. API returns an empty release collection from PostgreSQL.
4. UI renders the empty state component using API fields only.

## API error state

1. API or database returns `SYSTEM_ERROR` or another documented error.
2. React shows `ErrorState` with `displayMessage` from the API payload.
3. UI does not synthesize alternate business values or risk scores.

## Demo actor context

1. User opens the dashboard with `demoUserId=<viewer-user-id>` in the query string.
2. Loader passes `x-demo-user-id` to the API.
3. Dashboard loads with viewer permissions and PostgreSQL-computed risk data.
4. Transition attempt returns `PERMISSION_DENIED` when the viewer cannot transition releases.

## Empty service demo

1. Actor opens `/release-risk-dashboard?serviceId=00000000-0000-0000-0000-000000000011`.
2. Loader returns the seeded empty service **Staging Checkout API**.
3. UI renders the empty state without inventing release or risk data.

## E2E release risk flow

Playwright flow for the release-risk template:

1. Open the release risk dashboard route.
2. See the seeded service name **Checkout API**.
3. See the seeded release item **Checkout reliability release** with PostgreSQL-computed risk level.
4. Approve the release through the UI action.
5. See the updated release status in the page.

This flow validates the full read-and-mutate path across web, API, and PostgreSQL.
