import type { NextFunction, Request, Response, Router } from "express";

import type { EndpointDefinition } from "@__PROJECT_NAME_PKG__/contract";
import { errorRegistry } from "@__PROJECT_NAME_PKG__/contract";

import { callProcedure } from "../db/callProcedure.js";
import { pool } from "../db/pool.js";
import {
  clearSessionCookie,
  setSessionCookie,
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
  router: Router,
  endpoint: EndpointDefinition,
): void {
  registeredEndpoints.add(endpointKey(endpoint));

  const method = endpoint.method.toLowerCase() as Lowercase<
    EndpointDefinition["method"]
  >;

  router[method](endpoint.path, async (req, res, next) => {
    try {
      if (endpoint.auth === "required" && !req.sessionToken) {
        res.status(401).json(unauthenticatedResponse());
        return;
      }

      const validated = validateEndpointInputs(endpoint, req);
      const args = bindProcedureArgs(endpoint, validated);
      const rawResult = await callProcedure<Record<string, unknown>>(
        pool,
        endpoint.procedure.name,
        args,
        req.sessionToken,
      );

      if (endpoint.authBehavior === "setsSessionCookie") {
        const sessionToken = rawResult.sessionToken;
        if (typeof sessionToken !== "string" || sessionToken.length === 0) {
          throw new Error("Login procedure did not return a session token.");
        }

        setSessionCookie(res, sessionToken);
      }

      if (endpoint.authBehavior === "clearsSessionCookie") {
        clearSessionCookie(res);
      }

      const result = stripSessionToken(rawResult);

      if (process.env.NODE_ENV !== "production") {
        endpoint.response.parse(result);
      }

      res.json(result);
    } catch (error) {
      if (error instanceof ValidationInputError) {
        res.status(400).json(validationFailedResponse());
        return;
      }

      next(error);
    }
  });
}

export type RouteRegistrar = (
  router: Router,
  endpoint: EndpointDefinition,
) => void;
