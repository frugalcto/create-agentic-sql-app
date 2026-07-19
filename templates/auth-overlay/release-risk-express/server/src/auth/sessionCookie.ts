import type { CookieOptions } from "express";

import { getSessionCookieMaxAgeSeconds, isSessionCookieSecure } from "../config/loadEnv.js";

export const SESSION_COOKIE_NAME = "app_session";

export function getSessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: isSessionCookieSecure(),
    path: "/",
    maxAge: getSessionCookieMaxAgeSeconds() * 1000,
  };
}
