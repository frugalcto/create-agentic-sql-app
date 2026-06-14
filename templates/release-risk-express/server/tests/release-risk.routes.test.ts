import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";
import { pool } from "../src/db/pool.js";
import {
  OWNER_USER_ID,
  RELEASE_ID,
  SERVICE_ID,
  VIEWER_USER_ID,
} from "./constants.js";

describe("release risk routes", () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    app = createApp();
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query("update app.releases set status = 'draft' where id = $1", [
      RELEASE_ID,
    ]);
  });

  it("GET /api/release-risk-dashboard calls DB procedure and returns JSON", async () => {
    const response = await request(app)
      .get(`/api/release-risk-dashboard?serviceId=${SERVICE_ID}`)
      .set("x-demo-user-id", OWNER_USER_ID);

    expect(response.status).toBe(200);
    expect(response.body.service).toMatchObject({
      id: SERVICE_ID,
      name: "Payments API",
    });
    expect(Array.isArray(response.body.releases)).toBe(true);
    expect(response.body.canTransitionReleases).toBe(true);
    expect(response.body.releases[0]).toMatchObject({
      riskScore: 34,
      riskLevel: "medium",
    });
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
