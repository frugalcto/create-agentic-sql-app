import type { FastifyInstance } from "fastify";

import type { EndpointDefinition } from "@__PROJECT_NAME_PKG__/contract";
import { errorRegistry } from "@__PROJECT_NAME_PKG__/contract";

import { callProcedure } from "../db/callProcedure.js";
import { pool } from "../db/pool.js";
import {
  buildClearSessionCookieHeader,
  buildSessionCookieHeader,
} from "../middleware/sessionContext.js";
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

function unauthenticatedResponse() {
  const definition = errorRegistry.UNAUTHENTICATED;

  return {
    error: {
      code: "UNAUTHENTICATED",
      category: definition.category,
      displayMessage: definition.displayMessage,
    },
  };
}

function stripSessionToken(result: Record<string, unknown>): Record<string, unknown> {
  const { sessionToken: _sessionToken, ...rest } = result;
  return rest;
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
      if (endpoint.auth === "required" && !request.sessionToken) {
        return reply.status(401).send(unauthenticatedResponse());
      }

      const validated = validateEndpointInputs(endpoint, request);
      const args = bindProcedureArgs(endpoint, validated);
      const rawResult = await callProcedure<Record<string, unknown>>(
        pool,
        endpoint.procedure.name,
        args,
        request.sessionToken,
      );

      if (endpoint.authBehavior === "setsSessionCookie") {
        const sessionToken = rawResult.sessionToken;
        if (typeof sessionToken !== "string" || sessionToken.length === 0) {
          throw new Error("Login procedure did not return a session token.");
        }

        reply.header("Set-Cookie", buildSessionCookieHeader(sessionToken));
      }

      if (endpoint.authBehavior === "clearsSessionCookie") {
        reply.header("Set-Cookie", buildClearSessionCookieHeader());
      }

      const result = stripSessionToken(rawResult);

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
