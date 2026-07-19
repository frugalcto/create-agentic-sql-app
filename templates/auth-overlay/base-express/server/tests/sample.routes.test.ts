import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";
import { pool } from "../src/db/pool.js";
import { SESSION_COOKIE_NAME } from "../src/auth/sessionCookie.js";
import {
  OWNER_EMAIL,
  OWNER_PASSWORD,
  PROJECT_ID,
  RELEASE_ID,
  VIEWER_EMAIL,
  VIEWER_PASSWORD,
} from "./constants.js";

async function login(
  app: ReturnType<typeof createApp>,
  email: string,
  password: string,
): Promise<string> {
  const response = await request(app)
    .post("/api/auth/login")
    .send({ email, password });

  expect(response.status).toBe(200);

  const cookieHeader = response.headers["set-cookie"];
  const cookieValue = Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader;
  expect(cookieValue).toContain(`${SESSION_COOKIE_NAME}=`);

  const match = cookieValue?.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
  expect(match?.[1]).toBeTruthy();
  return match![1];
}

describe("auth routes", () => {
  const app = createApp();

  beforeEach(async () => {
    await pool.query(
      "update app.release_items set status = 'draft' where id = $1",
      [RELEASE_ID],
    );
  });

  it("POST /api/auth/login sets a secure session cookie and returns the user", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: OWNER_EMAIL, password: OWNER_PASSWORD });

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({
      email: OWNER_EMAIL,
    });
    expect(response.body.sessionToken).toBeUndefined();

    const cookieHeader = response.headers["set-cookie"];
    const cookieValue = Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader;
    expect(cookieValue).toContain("HttpOnly");
    expect(cookieValue).toContain("SameSite=Lax");
    expect(cookieValue).toContain(`${SESSION_COOKIE_NAME}=`);
  });

  it("GET /api/sample-dashboard requires a session cookie", async () => {
    const response = await request(app)
      .get("/api/sample-dashboard")
      .query({ projectId: PROJECT_ID });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("GET /api/sample-dashboard returns dashboard data for an authenticated owner", async () => {
    const sessionToken = await login(app, OWNER_EMAIL, OWNER_PASSWORD);

    const response = await request(app)
      .get("/api/sample-dashboard")
      .query({ projectId: PROJECT_ID })
      .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

    expect(response.status).toBe(200);
    expect(response.body.project).toMatchObject({
      id: PROJECT_ID,
      name: "Agentic SQL Demo",
    });
    expect(response.body.canTransitionReleases).toBe(true);
  });

  it("maps viewer transition attempts to 403", async () => {
    const sessionToken = await login(app, VIEWER_EMAIL, VIEWER_PASSWORD);

    const response = await request(app)
      .post(`/api/releases/${RELEASE_ID}/transition`)
      .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
      .send({ targetStatus: "approved" });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("PERMISSION_DENIED");
  });

  it("POST /api/auth/logout revokes the session cookie", async () => {
    const sessionToken = await login(app, OWNER_EMAIL, OWNER_PASSWORD);

    const logoutResponse = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.body.loggedOut).toBe(true);

    const dashboardResponse = await request(app)
      .get("/api/sample-dashboard")
      .query({ projectId: PROJECT_ID })
      .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

    expect(dashboardResponse.status).toBe(401);
  });
});
