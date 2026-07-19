import type { FastifyInstance } from "fastify";

import type { EndpointDefinition } from "@__PROJECT_NAME_PKG__/contract";

import { callProcedure } from "../db/callProcedure.js";
import { pool } from "../db/pool.js";
import { bindProcedureArgs } from "./bindProcedureArgs.js";
import {
  validateEndpointInputs,
  ValidationInputError,
} from "./validateInputs.js";

export const registeredEndpoints = new Set<string>();

function endpointKey(endpoint: EndpointDefinition): string {
  return `${endpoint.method} ${endpoint.path}`;
}

function validationFailedResponse() {
  return {
    error: {
      code: "VALIDATION_FAILED",
      category: "validation",
      displayMessage: "The request failed validation.",
    },
  };
}

export function registerEndpoint(
  app: FastifyInstance,
  endpoint: EndpointDefinition,
): void {
  registeredEndpoints.add(endpointKey(endpoint));

  const method = endpoint.method.toLowerCase() as Lowercase<
    EndpointDefinition["method"]
  >;

  app[method](endpoint.path, async (request, reply) => {
    try {
      const validated = validateEndpointInputs(endpoint, request);
      const args = bindProcedureArgs(endpoint, request.actor, validated);
      const result = await callProcedure<unknown>(
        pool,
        endpoint.procedure.name,
        args,
      );

      if (process.env.NODE_ENV !== "production") {
        endpoint.response.parse(result);
      }

      return result;
    } catch (error) {
      if (error instanceof ValidationInputError) {
        return reply.status(400).send(validationFailedResponse());
      }

      throw error;
    }
  });
}
