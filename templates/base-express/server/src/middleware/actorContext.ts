import type { NextFunction, Request, Response } from "express";

export const DEFAULT_ADMIN_USER_ID = "00000000-0000-0000-0000-000000000001";

export interface ActorContext {
  userId: string;
}

declare module "express-serve-static-core" {
  interface Request {
    actor: ActorContext;
  }
}

export function actorContext(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const headerValue = req.header("x-demo-user-id");
  const userId =
    typeof headerValue === "string" && headerValue.trim().length > 0
      ? headerValue.trim()
      : DEFAULT_ADMIN_USER_ID;

  req.actor = { userId };
  next();
}
