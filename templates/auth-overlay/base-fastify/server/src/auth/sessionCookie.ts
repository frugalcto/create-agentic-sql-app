import { getSessionCookieMaxAgeSeconds, isSessionCookieSecure } from "../config/loadEnv.js";

export const SESSION_COOKIE_NAME = "app_session";

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isSessionCookieSecure(),
    path: "/",
    maxAge: getSessionCookieMaxAgeSeconds() * 1000,
  };
}
