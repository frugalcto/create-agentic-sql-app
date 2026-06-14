import { Router } from "express";

import { callProcedure } from "../db/callProcedure.js";
import { pool } from "../db/pool.js";

export const healthRouter = Router();

healthRouter.get("/api/health", async (_req, res, next) => {
  try {
    const result = await callProcedure<{ status: string }>(
      pool,
      "app.app_health_check",
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});
