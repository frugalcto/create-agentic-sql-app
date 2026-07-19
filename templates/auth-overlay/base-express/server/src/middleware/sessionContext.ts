import type { NextFunction, Request, Response } from "express";

import { getSessionCookieOptions, SESSION_COOKIE_NAME } from "../auth/sessionCookie.js";

export function parseCookies(
  header: string | undefined,
): Record<string, string> {
  if (!header) {
    return {};
  }

  return Object.fromEntries(
    header.split(";").map((part) => {
      const separatorIndex = part.indexOf("=");
      if (separatorIndex === -1) {
        return [part.trim(), ""];
      }

      const key = part.slice(0, separatorIndex).trim();
      const value = part.slice(separatorIndex + 1).trim();
      return [key, decodeURIComponent(value)];
    }),
  );
}

export function getSessionToken(request: Request): string | null {
  const cookies = parseCookies(request.headers.cookie);
  const token = cookies[SESSION_COOKIE_NAME];

  return typeof token === "string" && token.length > 0 ? token : null;
}

export function sessionContext(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  req.sessionToken = getSessionToken(req);
  next();
}

declare module "express-serve-static-core" {
  interface Request {
    sessionToken: string | null;
  }
}

export function setSessionCookie(response: Response, sessionToken: string): void {
  const options = getSessionCookieOptions();
  response.cookie(SESSION_COOKIE_NAME, sessionToken, options);
}

export function clearSessionCookie(response: Response): void {
  const options = getSessionCookieOptions();
  response.clearCookie(SESSION_COOKIE_NAME, options);
}
