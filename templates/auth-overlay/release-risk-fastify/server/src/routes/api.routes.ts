import type { FastifyInstance } from "fastify";

import { endpoints } from "@__PROJECT_NAME_PKG__/contract";

import { registerEndpoint } from "../contract/registerEndpoint.js";

export async function registerApiRoutes(
  app: FastifyInstance,
): Promise<void> {
  registerEndpoint(app, endpoints.health);
  registerEndpoint(app, endpoints.login);
  registerEndpoint(app, endpoints.logout);
  registerEndpoint(app, endpoints.currentUser);
  registerEndpoint(app, endpoints.getReleaseRiskDashboard);
  registerEndpoint(app, endpoints.transitionRelease);
}
