export type ErrorCategory = "business_rule" | "validation" | "system";

export interface ErrorDefinition {
  statusCode: number;
  category: ErrorCategory;
  displayMessage: string;
  description: string;
  uiBehavior: string;
}

export const errorRegistry = {
  PERMISSION_DENIED: {
    statusCode: 403,
    category: "business_rule",
    displayMessage: "You do not have permission to perform this action.",
    description: "Actor is not a member, or lacks the required role.",
    uiBehavior:
      "Show an error state on the current page. Do not retry automatically.",
  },
  SERVICE_NOT_FOUND: {
    statusCode: 404,
    category: "business_rule",
    displayMessage: "Service not found.",
    description: "The requested service does not exist.",
    uiBehavior: "Show a not-found style error state for the dashboard.",
  },
  RELEASE_NOT_FOUND: {
    statusCode: 404,
    category: "business_rule",
    displayMessage: "Release not found.",
    description: "The requested release does not exist.",
    uiBehavior:
      "Show a not-found style error state for the dashboard or mutation result.",
  },
  RELEASE_INVALID_TRANSITION: {
    statusCode: 400,
    category: "business_rule",
    displayMessage: "This release cannot be moved to that status.",
    description: "The requested status transition is not allowed.",
    uiBehavior:
      "Show the API error message near the transition action. Keep the current dashboard data visible.",
  },
  VALIDATION_FAILED: {
    statusCode: 400,
    category: "validation",
    displayMessage: "The request failed validation.",
    description: "Request parameters or body failed validation.",
    uiBehavior:
      "Show a validation error state. Do not invent field-level messages unless the API returns them.",
  },
  SYSTEM_ERROR: {
    statusCode: 500,
    category: "system",
    displayMessage: "Something went wrong.",
    description: "SYSTEM_ERROR or unmapped database failure.",
    uiBehavior:
      "Show a generic error state and avoid exposing internal details.",
  },
} as const satisfies Record<string, ErrorDefinition>;

export type ErrorCode = keyof typeof errorRegistry;

export const ERROR_CODES = Object.keys(errorRegistry) as ErrorCode[];

export const INTERNAL_PROCEDURES = [
  "raise_app_error",
  "app_calculate_release_risk",
] as const;
