import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";
import { pool } from "../src/db/pool.js";
import {
  OWNER_USER_ID,
  PROJECT_ID,
  RELEASE_ID,
  VIEWER_USER_ID,
} from "./constants.js";

describe("sample routes", () => {
  let app: Awaited<ReturnType<typeof createApp>>;

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await pool.query(
      "update app.release_items set status = 'draft' where id = $1",
      [RELEASE_ID],
    );
  });

  it("GET /api/sample-dashboard calls DB procedure and returns JSON", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/api/sample-dashboard?projectId=${PROJECT_ID}`,
      headers: {
        "x-demo-user-id": OWNER_USER_ID,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.project).toMatchObject({
      id: PROJECT_ID,
      name: "Agentic SQL Demo",
    });
    expect(Array.isArray(body.releases)).toBe(true);
    expect(body.canTransitionReleases).toBe(true);
  });

  it("maps permission errors to 403", async () => {
    const response = await app.inject({
      method: "POST",
      url: `/api/releases/${RELEASE_ID}/transition`,
      headers: {
        "x-demo-user-id": VIEWER_USER_ID,
        "content-type": "application/json",
      },
      payload: {
        targetStatus: "approved",
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({
      error: {
        code: "PERMISSION_DENIED",
        category: "business_rule",
        displayMessage: "You do not have permission to perform this action.",
      },
    });
  });

  it("maps invalid transition errors to 400", async () => {
    const response = await app.inject({
      method: "POST",
      url: `/api/releases/${RELEASE_ID}/transition`,
      headers: {
        "x-demo-user-id": OWNER_USER_ID,
        "content-type": "application/json",
      },
      payload: {
        targetStatus: "released",
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: {
        code: "RELEASE_INVALID_TRANSITION",
        category: "business_rule",
        displayMessage: "This release cannot be moved to that status.",
      },
    });
  });
});
