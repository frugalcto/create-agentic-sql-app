import type { DatabaseError } from "pg";

import {
  ApiError,
  type ApiErrorBody,
  type ErrorCode,
} from "./errorTypes.js";

const ERROR_DEFINITIONS: Record<
  ErrorCode,
  { statusCode: number; category: ApiErrorBody["error"]["category"]; displayMessage: string }
> = {
  PERMISSION_DENIED: {
    statusCode: 403,
    category: "business_rule",
    displayMessage: "You do not have permission to perform this action.",
  },
  SERVICE_NOT_FOUND: {
    statusCode: 404,
    category: "business_rule",
    displayMessage: "Service not found.",
  },
  RELEASE_NOT_FOUND: {
    statusCode: 404,
    category: "business_rule",
    displayMessage: "Release not found.",
  },
  RELEASE_INVALID_TRANSITION: {
    statusCode: 400,
    category: "business_rule",
    displayMessage: "This release cannot be moved to that status.",
  },
  VALIDATION_FAILED: {
    statusCode: 400,
    category: "validation",
    displayMessage: "The request failed validation.",
  },
  SYSTEM_ERROR: {
    statusCode: 500,
    category: "system",
    displayMessage: "Something went wrong.",
  },
};

function isDatabaseError(error: unknown): error is DatabaseError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error
  );
}

function isKnownErrorCode(message: string): message is ErrorCode {
  return message in ERROR_DEFINITIONS;
}

export function mapDatabaseError(error: unknown): ApiError | null {
  if (!isDatabaseError(error)) {
    return null;
  }

  const code = error.message.trim();

  if (!isKnownErrorCode(code)) {
    return new ApiError(
      ERROR_DEFINITIONS.SYSTEM_ERROR.statusCode,
      {
        error: {
          code: "SYSTEM_ERROR",
          category: ERROR_DEFINITIONS.SYSTEM_ERROR.category,
          displayMessage: ERROR_DEFINITIONS.SYSTEM_ERROR.displayMessage,
        },
      },
    );
  }

  const definition = ERROR_DEFINITIONS[code];

  return new ApiError(definition.statusCode, {
    error: {
      code,
      category: definition.category,
      displayMessage: definition.displayMessage,
    },
  });
}
