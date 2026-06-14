import express from "express";

import { actorContext } from "./middleware/actorContext.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";
import { healthRouter } from "./routes/health.routes.js";
import { releaseRiskRouter } from "./routes/release-risk.routes.js";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(actorContext);
  app.use(healthRouter);
  app.use(releaseRiskRouter);
  app.use(errorMiddleware);

  return app;
}
