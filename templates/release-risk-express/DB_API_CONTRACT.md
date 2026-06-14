# DB API Contract — __PROJECT_NAME__

This document is the source of truth for route-to-procedure mapping. API and React code must follow it exactly.

## Actor context

All protected routes receive an actor from demo middleware:

- Header: `x-demo-user-id`
- Fallback: seeded admin user when the header is absent

The API passes `p_actor_user_id` to stored procedures. React must not infer permissions locally.

---

## GET /api/health

| Field | Value |
| --- | --- |
| Method | `GET` |
| Route | `/api/health` |
| Stored procedure | `app.app_health_check()` |
| Parameters | none |
| Response shape | `{ "status": "ok" }` |
| Error codes | `SYSTEM_ERROR` |
| Frontend expectation | not used by React routes in the release-risk template |
| Forbidden responsibilities | health checks must not be implemented in API business logic |

---

## GET /api/release-risk-dashboard

| Field | Value |
| --- | --- |
| Method | `GET` |
| Route | `/api/release-risk-dashboard` |
| Query params | `serviceId` (UUID) |
| Stored procedure | `app.app_get_release_risk_dashboard(p_actor_user_id uuid, p_service_id uuid)` |
| Supporting procedure | `app.app_calculate_release_risk(p_release_id uuid)` computes `riskScore`, `riskLevel`, and `riskFactors` inside PostgreSQL |
| Response shape | JSON object returned by the procedure, including service summary and releases with PostgreSQL-computed risk fields |
| Error codes | `PERMISSION_DENIED`, `SERVICE_NOT_FOUND`, `SYSTEM_ERROR` |
| Frontend loader | `web/src/routes/release-risk-dashboard.tsx` loader fetches this route |
| Forbidden responsibilities | React must not compute risk scores, permission state, release status rules, or dashboard metrics |

Example response fields are owned by PostgreSQL. React renders `riskScore`, `riskLevel`, and `riskFactors` as returned.

---

## POST /api/releases/:releaseId/transition

| Field | Value |
| --- | --- |
| Method | `POST` |
| Route | `/api/releases/:releaseId/transition` |
| Path params | `releaseId` (UUID) |
| Request body | `{ "targetStatus": "approved" \| "released" \| "draft" }` |
| Stored procedure | `app.app_transition_release(p_actor_user_id uuid, p_release_id uuid, p_target_status text)` |
| Response shape | JSON object returned by the procedure, including updated release state and refreshed PostgreSQL risk payload |
| Error codes | `PERMISSION_DENIED`, `RELEASE_NOT_FOUND`, `RELEASE_INVALID_TRANSITION`, `VALIDATION_FAILED`, `SYSTEM_ERROR` |
| Frontend action | `web/src/routes/release-risk-dashboard.tsx` action submits this mutation |
| Forbidden responsibilities | API must not validate transitions; React must not decide allowed target statuses or recalculate risk |

---

## Contract change rules

When adding a route or procedure:

1. Update this file first or in the same change.
2. Update `ERROR_CODES.md` for any new business errors.
3. Add database tests before API exposure.
4. Add API tests before frontend wiring.
5. Update `SCENARIOS.md` when user-visible behavior changes.
