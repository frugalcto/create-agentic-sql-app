import Fastify from "fastify";

import { actorContextHook } from "./middleware/actorContext.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";
import { registerHealthRoutes } from "./routes/health.routes.js";
import { registerSampleRoutes } from "./routes/sample.routes.js";

export async function createApp() {
  const app = Fastify();

  app.addHook("onRequest", actorContextHook);
  app.setErrorHandler(errorMiddleware);

  await registerHealthRoutes(app);
  await registerSampleRoutes(app);

  return app;
}
