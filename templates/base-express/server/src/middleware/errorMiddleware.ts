import type { NextFunction, Request, Response } from "express";

import { ApiError } from "../errors/errorTypes.js";
import { mapDatabaseError } from "../errors/mapDatabaseError.js";

export function errorMiddleware(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json(error.body);
    return;
  }

  const mappedError = mapDatabaseError(error);

  if (mappedError) {
    res.status(mappedError.statusCode).json(mappedError.body);
    return;
  }

  res.status(500).json({
    error: {
      code: "SYSTEM_ERROR",
      category: "system",
      displayMessage: "Something went wrong.",
    },
  });
}
