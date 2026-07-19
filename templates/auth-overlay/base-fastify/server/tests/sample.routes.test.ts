import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";
import { SESSION_COOKIE_NAME } from "../src/auth/sessionCookie.js";
import { pool } from "../src/db/pool.js";
import {
  OWNER_EMAIL,
  OWNER_PASSWORD,
  PROJECT_ID,
  RELEASE_ID,
  VIEWER_EMAIL,
  VIEWER_PASSWORD,
} from "./constants.js";

async function login(
  app: Awaited<ReturnType<typeof createApp>>,
  email: string,
  password: string,
): Promise<string> {
  const response = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    headers: {
      "content-type": "application/json",
    },
    payload: {
      email,
      password,
    },
  });

  expect(response.statusCode).toBe(200);

  const cookieHeader = response.headers["set-cookie"];
  const cookieValue = Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader;
  const match = cookieValue?.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
  expect(match?.[1]).toBeTruthy();
  return match![1];
}

describe("auth routes", () => {
  let app: Awaited<ReturnType<typeof createApp>>;

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(async () => {
    await app.close();
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query(
      "update app.release_items set status = 'draft' where id = $1",
      [RELEASE_ID],
    );
  });

  it("GET /api/sample-dashboard requires a session cookie", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/api/sample-dashboard?projectId=${PROJECT_ID}`,
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe("UNAUTHENTICATED");
  });

  it("GET /api/sample-dashboard returns dashboard data for an authenticated owner", async () => {
    const sessionToken = await login(app, OWNER_EMAIL, OWNER_PASSWORD);

    const response = await app.inject({
      method: "GET",
      url: `/api/sample-dashboard?projectId=${PROJECT_ID}`,
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=${sessionToken}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().project).toMatchObject({
      id: PROJECT_ID,
      name: "Agentic SQL Demo",
    });
    expect(response.json().canTransitionReleases).toBe(true);
  });

  it("maps viewer transition attempts to 403", async () => {
    const sessionToken = await login(app, VIEWER_EMAIL, VIEWER_PASSWORD);

    const response = await app.inject({
      method: "POST",
      url: `/api/releases/${RELEASE_ID}/transition`,
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=${sessionToken}`,
        "content-type": "application/json",
      },
      payload: {
        targetStatus: "approved",
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe("PERMISSION_DENIED");
  });
});
