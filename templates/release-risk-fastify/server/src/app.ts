import Fastify from "fastify";

import { actorContextHook } from "./middleware/actorContext.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";
import { registerApiRoutes } from "./routes/api.routes.js";

export async function createApp() {
  const app = Fastify();

  app.addHook("onRequest", actorContextHook);
  app.setErrorHandler(errorMiddleware);

  await registerApiRoutes(app);

  return app;
}
