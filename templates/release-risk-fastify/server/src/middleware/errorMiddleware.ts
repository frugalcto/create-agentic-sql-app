import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";

import { ApiError } from "../errors/errorTypes.js";
import { mapDatabaseError } from "../errors/mapDatabaseError.js";

export function errorMiddleware(
  error: FastifyError,
  _request: FastifyRequest,
  reply: FastifyReply,
): void {
  if (error instanceof ApiError) {
    reply.status(error.statusCode).send(error.body);
    return;
  }

  const mappedError = mapDatabaseError(error);

  if (mappedError) {
    reply.status(mappedError.statusCode).send(mappedError.body);
    return;
  }

  reply.status(500).send({
    error: {
      code: "SYSTEM_ERROR",
      category: "system",
      displayMessage: "Something went wrong.",
    },
  });
}
