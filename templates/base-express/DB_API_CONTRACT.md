<!-- GENERATED from contract/src — edit the contract module, then run npm run contract:generate. Do not edit by hand. -->

# DB API Contract — __PROJECT_NAME__

This document is generated from `contract/src/endpoints.ts`. API and React code must follow it exactly.

## Actor context

All protected routes receive an actor from demo middleware:

- Header: `x-demo-user-id`
- Fallback: seeded admin user when the header is absent

The API passes `p_actor_user_id` to stored procedures. React must not infer permissions locally.

---

## GET /api/health

| Field | Value |
| --- | --- |
| Key | `health` |
| Method | `GET` |
| Route | `/api/health` |
| Stored procedure | `app.app_health_check(none)` |
| Parameter sources | none |
| Response schema | `see contract/src/endpoints.ts` |
| Error codes | `SYSTEM_ERROR` |
| Frontend expectation | not used by React routes in the base template |
| Forbidden responsibilities | Health checks must not be implemented in Express business logic. |

---

## GET /api/sample-dashboard

| Field | Value |
| --- | --- |
| Key | `getSampleDashboard` |
| Method | `GET` |
| Route | `/api/sample-dashboard` |
| Stored procedure | `app.app_get_sample_dashboard(p_actor_user_id uuid, p_project_id uuid)` |
| Query params | see contract schema for `getSampleDashboard` |
| Parameter sources | p_actor_user_id ← actor; p_project_id ← query.projectId |
| Response schema | `see contract/src/endpoints.ts` |
| Error codes | `PERMISSION_DENIED`, `RELEASE_NOT_FOUND`, `SYSTEM_ERROR` |
| Frontend expectation | web/src/routes/sample-dashboard.tsx loader uses this route |
| Forbidden responsibilities | React must not compute permissions, release status rules, or dashboard metrics. |

---

## POST /api/releases/:releaseId/transition

| Field | Value |
| --- | --- |
| Key | `transitionRelease` |
| Method | `POST` |
| Route | `/api/releases/:releaseId/transition` |
| Stored procedure | `app.app_transition_release(p_actor_user_id uuid, p_release_id uuid, p_target_status text)` |
| Request body | see contract schema for `transitionRelease` |
| Path params | see contract schema for `transitionRelease` |
| Parameter sources | p_actor_user_id ← actor; p_release_id ← path.releaseId; p_target_status ← body.targetStatus |
| Response schema | `see contract/src/endpoints.ts` |
| Error codes | `PERMISSION_DENIED`, `RELEASE_NOT_FOUND`, `RELEASE_INVALID_TRANSITION`, `VALIDATION_FAILED`, `SYSTEM_ERROR` |
| Frontend expectation | web/src/routes/sample-dashboard.tsx action uses this route |
| Forbidden responsibilities | API must not validate transitions; React must not decide allowed target statuses. |

---

## Contract change rules

When adding a route or procedure:

1. Update `contract/src/endpoints.ts` first.
2. Run `npm run contract:generate`.
3. Add database tests before API exposure.
4. Add API tests before frontend wiring.
5. Update `SCENARIOS.md` when user-visible behavior changes.
