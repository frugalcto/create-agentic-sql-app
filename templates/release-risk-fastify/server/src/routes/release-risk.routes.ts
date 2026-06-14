import type { FastifyInstance, FastifyReply } from "fastify";

import { callProcedure } from "../db/callProcedure.js";
import { pool } from "../db/pool.js";

function validationFailed(reply: FastifyReply) {
  return reply.status(400).send({
    error: {
      code: "VALIDATION_FAILED",
      category: "validation",
      displayMessage: "The request failed validation.",
    },
  });
}

export async function registerReleaseRiskRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.get("/api/release-risk-dashboard", async (request, reply) => {
    const serviceId = (request.query as { serviceId?: string }).serviceId;

    if (typeof serviceId !== "string" || serviceId.trim().length === 0) {
      return validationFailed(reply);
    }

    return callProcedure<Record<string, unknown>>(
      pool,
      "app.app_get_release_risk_dashboard",
      {
        p_actor_user_id: request.actor.userId,
        p_service_id: serviceId,
      },
    );
  });

  app.post<{
    Params: { releaseId: string };
    Body: { targetStatus?: string };
  }>("/api/releases/:releaseId/transition", async (request, reply) => {
    const targetStatus = request.body?.targetStatus;

    if (typeof targetStatus !== "string" || targetStatus.trim().length === 0) {
      return validationFailed(reply);
    }

    return callProcedure<Record<string, unknown>>(
      pool,
      "app.app_transition_release",
      {
        p_actor_user_id: request.actor.userId,
        p_release_id: request.params.releaseId,
        p_target_status: targetStatus,
      },
    );
  });
}
