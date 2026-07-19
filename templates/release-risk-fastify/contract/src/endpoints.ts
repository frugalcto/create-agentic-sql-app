import { z } from "zod";

import { defineEndpoint } from "./schema.js";

const releaseStatusSchema = z.enum(["draft", "approved", "released"]);

const riskFactorsSchema = z.object({
  openCriticalIncidents: z.number(),
  openHighIncidents: z.number(),
  openMediumIncidents: z.number(),
  openSupportTickets: z.number(),
  openPullRequests: z.number(),
});

const riskPayloadSchema = z.object({
  riskScore: z.number(),
  riskLevel: z.string(),
  riskFactors: riskFactorsSchema,
});

const releaseRiskItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  version: z.string(),
  status: releaseStatusSchema,
  riskScore: z.number(),
  riskLevel: z.string(),
  riskFactors: riskFactorsSchema,
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
    forbidden: "Health checks must not be implemented in API business logic.",
  }),

  getReleaseRiskDashboard: defineEndpoint({
    method: "GET",
    path: "/api/release-risk-dashboard",
    query: z
      .object({
        serviceId: z.string().uuid(),
      })
      .strict(),
    procedure: {
      name: "app.app_get_release_risk_dashboard",
      params: [
        { name: "p_actor_user_id", pgType: "uuid", source: "actor" },
        { name: "p_service_id", pgType: "uuid", source: "query.serviceId" },
      ],
    },
    response: z.object({
      service: z.object({
        id: z.string().uuid(),
        name: z.string(),
      }),
      actorRole: z.string(),
      canTransitionReleases: z.boolean(),
      releases: z.array(releaseRiskItemSchema),
    }),
    errorCodes: ["PERMISSION_DENIED", "SERVICE_NOT_FOUND", "SYSTEM_ERROR"],
    frontend: {
      binding: "loader",
      file: "web/src/routes/release-risk-dashboard.tsx",
    },
    forbidden:
      "React must not compute risk scores, permission state, release status rules, or dashboard metrics.",
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
        serviceId: z.string().uuid(),
        name: z.string(),
        version: z.string(),
        status: releaseStatusSchema,
        risk: riskPayloadSchema,
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
      file: "web/src/routes/release-risk-dashboard.tsx",
    },
    forbidden:
      "API must not validate transitions; React must not decide allowed target statuses or recalculate risk.",
  }),
} as const;

export type EndpointKey = keyof typeof endpoints;
