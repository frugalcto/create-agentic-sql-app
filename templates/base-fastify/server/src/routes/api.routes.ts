import type { FastifyInstance } from "fastify";

import { endpoints } from "@__PROJECT_NAME_PKG__/contract";

import { registerEndpoint } from "../contract/registerEndpoint.js";

export async function registerApiRoutes(
  app: FastifyInstance,
): Promise<void> {
  registerEndpoint(app, endpoints.health);
  registerEndpoint(app, endpoints.getSampleDashboard);
  registerEndpoint(app, endpoints.transitionRelease);
}
