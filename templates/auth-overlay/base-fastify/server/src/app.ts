import Fastify from "fastify";

import { errorMiddleware } from "./middleware/errorMiddleware.js";
import { sessionContextHook } from "./middleware/sessionContext.js";
import { registerApiRoutes } from "./routes/api.routes.js";

export async function createApp() {
  const app = Fastify();

  app.addHook("onRequest", sessionContextHook);
  app.setErrorHandler(errorMiddleware);

  await registerApiRoutes(app);

  return app;
}
