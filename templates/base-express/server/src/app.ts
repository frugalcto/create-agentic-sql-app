import express from "express";

import { actorContext } from "./middleware/actorContext.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";
import { healthRouter } from "./routes/health.routes.js";
import { sampleRouter } from "./routes/sample.routes.js";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(actorContext);
  app.use(healthRouter);
  app.use(sampleRouter);
  app.use(errorMiddleware);

  return app;
}
