export const ERROR_CODES = [
  "PERMISSION_DENIED",
  "RELEASE_NOT_FOUND",
  "RELEASE_INVALID_TRANSITION",
  "VALIDATION_FAILED",
  "SYSTEM_ERROR",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export type ErrorCategory = "business_rule" | "validation" | "system";

export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    category: ErrorCategory;
    displayMessage: string;
  };
}

export class ApiError extends Error {
  readonly statusCode: number;
  readonly body: ApiErrorBody;

  constructor(statusCode: number, body: ApiErrorBody) {
    super(body.error.code);
    this.statusCode = statusCode;
    this.body = body;
  }
}
