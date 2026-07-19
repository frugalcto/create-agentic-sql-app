import express from "express";

import { actorContext } from "./middleware/actorContext.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";
import { apiRouter } from "./routes/api.routes.js";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(actorContext);
  app.use(apiRouter);
  app.use(errorMiddleware);

  return app;
}
