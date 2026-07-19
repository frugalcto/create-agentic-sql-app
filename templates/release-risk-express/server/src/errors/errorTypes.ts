import type { ErrorCode as ContractErrorCode } from "@__PROJECT_NAME_PKG__/contract";

export type ErrorCode = ContractErrorCode;

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
