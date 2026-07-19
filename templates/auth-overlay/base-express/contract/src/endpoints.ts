import { z } from "zod";

import { defineEndpoint } from "./schema.js";

const releaseStatusSchema = z.enum(["draft", "approved", "released"]);

const releaseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: releaseStatusSchema,
});

const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
});

export const endpoints = {
  health: defineEndpoint({
    method: "GET",
    path: "/api/health",
    auth: "public",
    procedure: {
      name: "app.app_health_check",
      params: [],
    },
    response: z.object({
      status: z.literal("ok"),
    }),
    errorCodes: ["SYSTEM_ERROR"],
    frontend: {
      binding: "none",
    },
    forbidden: "Health checks must not be implemented in Express business logic.",
  }),

  login: defineEndpoint({
    method: "POST",
    path: "/api/auth/login",
    auth: "public",
    authBehavior: "setsSessionCookie",
    body: z
      .object({
        email: z.string().email(),
        password: z.string().min(1),
      })
      .strict(),
    procedure: {
      name: "app.app_login",
      params: [
        { name: "p_email", pgType: "text", source: "body.email" },
        { name: "p_password", pgType: "text", source: "body.password" },
      ],
    },
    response: z.object({
      user: userSchema,
    }),
    errorCodes: ["INVALID_CREDENTIALS", "SYSTEM_ERROR"],
    frontend: {
      binding: "action",
      file: "web/src/routes/login.tsx",
    },
    forbidden: "API must not validate passwords or issue sessions outside PostgreSQL procedures.",
  }),

  logout: defineEndpoint({
    method: "POST",
    path: "/api/auth/logout",
    auth: "required",
    authBehavior: "clearsSessionCookie",
    procedure: {
      name: "app.app_logout",
      params: [],
    },
    response: z.object({
      loggedOut: z.literal(true),
    }),
    errorCodes: ["UNAUTHENTICATED", "SYSTEM_ERROR"],
    frontend: {
      binding: "action",
      file: "web/src/root.tsx",
    },
    forbidden: "API must not revoke sessions outside PostgreSQL procedures.",
  }),

  currentUser: defineEndpoint({
    method: "GET",
    path: "/api/auth/me",
    auth: "required",
    procedure: {
      name: "app.app_get_current_user",
      params: [],
    },
    response: userSchema,
    errorCodes: ["UNAUTHENTICATED", "SYSTEM_ERROR"],
    frontend: {
      binding: "loader",
      file: "web/src/root.tsx",
    },
    forbidden: "API must not resolve identity outside PostgreSQL session validation.",
  }),

  getSampleDashboard: defineEndpoint({
    method: "GET",
    path: "/api/sample-dashboard",
    auth: "required",
    query: z
      .object({
        projectId: z.string().uuid(),
      })
      .strict(),
    procedure: {
      name: "app.app_get_sample_dashboard",
      params: [
        { name: "p_project_id", pgType: "uuid", source: "query.projectId" },
      ],
    },
    response: z.object({
      project: z.object({
        id: z.string().uuid(),
        name: z.string(),
      }),
      actorRole: z.string(),
      canTransitionReleases: z.boolean(),
      releases: z.array(releaseSchema),
    }),
    errorCodes: [
      "UNAUTHENTICATED",
      "PERMISSION_DENIED",
      "RELEASE_NOT_FOUND",
      "SYSTEM_ERROR",
    ],
    frontend: {
      binding: "loader",
      file: "web/src/routes/sample-dashboard.tsx",
    },
    forbidden:
      "React must not compute permissions, release status rules, or dashboard metrics.",
  }),

  transitionRelease: defineEndpoint({
    method: "POST",
    path: "/api/releases/:releaseId/transition",
    auth: "required",
    pathParams: z
      .object({
        releaseId: z.string().uuid(),
      })
      .strict(),
    body: z
      .object({
        targetStatus: releaseStatusSchema,
      })
      .strict(),
    procedure: {
      name: "app.app_transition_release",
      params: [
        { name: "p_release_id", pgType: "uuid", source: "path.releaseId" },
        { name: "p_target_status", pgType: "text", source: "body.targetStatus" },
      ],
    },
    response: z.object({
      release: z.object({
        id: z.string().uuid(),
        projectId: z.string().uuid(),
        name: z.string(),
        status: releaseStatusSchema,
      }),
    }),
    errorCodes: [
      "UNAUTHENTICATED",
      "PERMISSION_DENIED",
      "RELEASE_NOT_FOUND",
      "RELEASE_INVALID_TRANSITION",
      "VALIDATION_FAILED",
      "SYSTEM_ERROR",
    ],
    frontend: {
      binding: "action",
      file: "web/src/routes/sample-dashboard.tsx",
    },
    forbidden:
      "API must not validate transitions; React must not decide allowed target statuses.",
  }),
} as const;

export type EndpointKey = keyof typeof endpoints;
