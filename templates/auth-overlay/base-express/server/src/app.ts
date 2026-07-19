import express from "express";

import { errorMiddleware } from "./middleware/errorMiddleware.js";
import { sessionContext } from "./middleware/sessionContext.js";
import { apiRouter } from "./routes/api.routes.js";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(sessionContext);
  app.use(apiRouter);
  app.use(errorMiddleware);

  return app;
}
