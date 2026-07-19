import { z } from "zod";

import { defineEndpoint } from "./schema.js";

const releaseStatusSchema = z.enum(["draft", "approved", "released"]);

const releaseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: releaseStatusSchema,
});

export const endpoints = {
  health: defineEndpoint({
    method: "GET",
    path: "/api/health",
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

  getSampleDashboard: defineEndpoint({
    method: "GET",
    path: "/api/sample-dashboard",
    query: z
      .object({
        projectId: z.string().uuid(),
      })
      .strict(),
    procedure: {
      name: "app.app_get_sample_dashboard",
      params: [
        { name: "p_actor_user_id", pgType: "uuid", source: "actor" },
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
    errorCodes: ["PERMISSION_DENIED", "RELEASE_NOT_FOUND", "SYSTEM_ERROR"],
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
        { name: "p_actor_user_id", pgType: "uuid", source: "actor" },
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
