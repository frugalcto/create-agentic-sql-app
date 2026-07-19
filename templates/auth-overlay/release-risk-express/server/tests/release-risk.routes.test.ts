import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";
import { pool } from "../src/db/pool.js";
import { SESSION_COOKIE_NAME } from "../src/auth/sessionCookie.js";
import {
  OWNER_EMAIL,
  OWNER_PASSWORD,
  RELEASE_ID,
  SERVICE_ID,
  VIEWER_EMAIL,
  VIEWER_PASSWORD,
} from "./constants.js";

async function login(
  app: Awaited<ReturnType<typeof createApp>>,
  email: string,
  password: string,
): Promise<string> {
  const response = await request(app.server)
    .post("/api/auth/login")
    .send({ email, password });

  expect(response.status).toBe(200);

  const cookieHeader = response.headers["set-cookie"];
  const cookieValue = Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader;
  const match = cookieValue?.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
  expect(match?.[1]).toBeTruthy();
  return match![1];
}

describe("auth routes", () => {
  let app: Awaited<ReturnType<typeof createApp>>;

  beforeEach(async () => {
    app = await createApp();
    await pool.query("update app.releases set status = 'draft' where id = $1", [
      RELEASE_ID,
    ]);
  });

  it("GET /api/release-risk-dashboard requires a session cookie", async () => {
    const response = await request(app.server)
      .get("/api/release-risk-dashboard")
      .query({ serviceId: SERVICE_ID });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("GET /api/release-risk-dashboard returns dashboard data for an authenticated owner", async () => {
    const sessionToken = await login(app, OWNER_EMAIL, OWNER_PASSWORD);

    const response = await request(app.server)
      .get("/api/release-risk-dashboard")
      .query({ serviceId: SERVICE_ID })
      .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

    expect(response.status).toBe(200);
    expect(response.body.service).toMatchObject({
      id: SERVICE_ID,
      name: "Checkout API",
    });
    expect(response.body.canTransitionReleases).toBe(true);
  });

  it("maps viewer transition attempts to 403", async () => {
    const sessionToken = await login(app, VIEWER_EMAIL, VIEWER_PASSWORD);

    const response = await request(app.server)
      .post(`/api/releases/${RELEASE_ID}/transition`)
      .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
      .send({ targetStatus: "approved" });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("PERMISSION_DENIED");
  });
});
