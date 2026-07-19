import type { FastifyRequest } from "fastify";
import type { ZodType } from "zod";

import type { EndpointDefinition } from "@__PROJECT_NAME_PKG__/contract";

export interface ValidatedInputs {
  query: Record<string, unknown>;
  pathParams: Record<string, unknown>;
  body: Record<string, unknown>;
}

function parseWithSchema<T extends ZodType>(
  schema: T | undefined,
  value: unknown,
  label: string,
): Record<string, unknown> {
  if (!schema) {
    return {};
  }

  const result = schema.safeParse(value);

  if (!result.success) {
    throw new ValidationInputError(`${label} validation failed`);
  }

  return result.data as Record<string, unknown>;
}

export class ValidationInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationInputError";
  }
}

export function validateEndpointInputs(
  endpoint: EndpointDefinition,
  request: FastifyRequest,
): ValidatedInputs {
  return {
    query: parseWithSchema(endpoint.query, request.query, "query"),
    pathParams: parseWithSchema(endpoint.pathParams, request.params, "path"),
    body: parseWithSchema(endpoint.body, request.body, "body"),
  };
}
