import type { NextFunction, Request, Response, Router } from "express";

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
  router: Router,
  endpoint: EndpointDefinition,
): void {
  registeredEndpoints.add(endpointKey(endpoint));

  const method = endpoint.method.toLowerCase() as Lowercase<
    EndpointDefinition["method"]
  >;

  router[method](endpoint.path, async (req, res, next) => {
    try {
      const validated = validateEndpointInputs(endpoint, req);
      const args = bindProcedureArgs(endpoint, req.actor, validated);
      const result = await callProcedure<unknown>(
        pool,
        endpoint.procedure.name,
        args,
      );

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
