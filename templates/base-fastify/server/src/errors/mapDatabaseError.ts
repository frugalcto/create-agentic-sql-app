import type { DatabaseError } from "pg";

import { errorRegistry } from "@__PROJECT_NAME_PKG__/contract";

import {
  ApiError,
  type ApiErrorBody,
  type ErrorCode,
} from "./errorTypes.js";

function isDatabaseError(error: unknown): error is DatabaseError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error
  );
}

function isKnownErrorCode(message: string): message is ErrorCode {
  return message in errorRegistry;
}

export function mapDatabaseError(error: unknown): ApiError | null {
  if (!isDatabaseError(error)) {
    return null;
  }

  const code = error.message.trim();

  if (!isKnownErrorCode(code)) {
    const definition = errorRegistry.SYSTEM_ERROR;

    return new ApiError(definition.statusCode, {
      error: {
        code: "SYSTEM_ERROR",
        category: definition.category,
        displayMessage: definition.displayMessage,
      },
    });
  }

  const definition = errorRegistry[code];

  return new ApiError(definition.statusCode, {
    error: {
      code,
      category: definition.category as ApiErrorBody["error"]["category"],
      displayMessage: definition.displayMessage,
    },
  });
}
