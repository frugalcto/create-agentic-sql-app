import { Router } from "express";

import { callProcedure } from "../db/callProcedure.js";
import { pool } from "../db/pool.js";

export const releaseRiskRouter = Router();

releaseRiskRouter.get("/api/release-risk-dashboard", async (req, res, next) => {
  try {
    const serviceId = req.query.serviceId;

    if (typeof serviceId !== "string" || serviceId.trim().length === 0) {
      res.status(400).json({
        error: {
          code: "VALIDATION_FAILED",
          category: "validation",
          displayMessage: "The request failed validation.",
        },
      });
      return;
    }

    const result = await callProcedure<Record<string, unknown>>(
      pool,
      "app.app_get_release_risk_dashboard",
      {
        p_actor_user_id: req.actor.userId,
        p_service_id: serviceId,
      },
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});

releaseRiskRouter.post(
  "/api/releases/:releaseId/transition",
  async (req, res, next) => {
    try {
      const targetStatus = req.body?.targetStatus;

      if (typeof targetStatus !== "string" || targetStatus.trim().length === 0) {
        res.status(400).json({
          error: {
            code: "VALIDATION_FAILED",
            category: "validation",
            displayMessage: "The request failed validation.",
          },
        });
        return;
      }

      const result = await callProcedure<Record<string, unknown>>(
        pool,
        "app.app_transition_release",
        {
          p_actor_user_id: req.actor.userId,
          p_release_id: req.params.releaseId,
          p_target_status: targetStatus,
        },
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);
