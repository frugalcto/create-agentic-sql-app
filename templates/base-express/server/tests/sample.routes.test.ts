import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";
import { pool } from "../src/db/pool.js";
import {
  OWNER_USER_ID,
  PROJECT_ID,
  RELEASE_ID,
  VIEWER_USER_ID,
} from "./constants.js";

describe("sample routes", () => {
  const app = createApp();

  beforeEach(async () => {
    await pool.query(
      "update app.release_items set status = 'draft' where id = $1",
      [RELEASE_ID],
    );
  });

  it("GET /api/sample-dashboard calls DB procedure and returns JSON", async () => {
    const response = await request(app)
      .get("/api/sample-dashboard")
      .query({ projectId: PROJECT_ID })
      .set("x-demo-user-id", OWNER_USER_ID);

    expect(response.status).toBe(200);
    expect(response.body.project).toMatchObject({
      id: PROJECT_ID,
      name: "Sample Project",
    });
    expect(Array.isArray(response.body.releases)).toBe(true);
    expect(response.body.canTransitionReleases).toBe(true);
  });

  it("maps permission errors to 403", async () => {
    const response = await request(app)
      .post(`/api/releases/${RELEASE_ID}/transition`)
      .set("x-demo-user-id", VIEWER_USER_ID)
      .send({ targetStatus: "approved" });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: {
        code: "PERMISSION_DENIED",
        category: "business_rule",
        displayMessage: "You do not have permission to perform this action.",
      },
    });
  });

  it("maps invalid transition errors to 400", async () => {
    const response = await request(app)
      .post(`/api/releases/${RELEASE_ID}/transition`)
      .set("x-demo-user-id", OWNER_USER_ID)
      .send({ targetStatus: "released" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: {
        code: "RELEASE_INVALID_TRANSITION",
        category: "business_rule",
        displayMessage: "This release cannot be moved to that status.",
      },
    });
  });
});
