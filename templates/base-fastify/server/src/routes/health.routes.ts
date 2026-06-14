import type { FastifyInstance } from "fastify";

import { callProcedure } from "../db/callProcedure.js";
import { pool } from "../db/pool.js";

export async function registerHealthRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.get("/api/health", async () => {
    return callProcedure<{ status: string }>(pool, "app.app_health_check");
  });
}
