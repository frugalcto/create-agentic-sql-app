import type { FastifyRequest } from "fastify";

import {
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "../auth/sessionCookie.js";

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

export function getSessionToken(request: FastifyRequest): string | null {
  const headerValue = request.headers.cookie;
  const cookieHeader = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  const cookies = parseCookies(cookieHeader);
  const token = cookies[SESSION_COOKIE_NAME];

  return typeof token === "string" && token.length > 0 ? token : null;
}

export async function sessionContextHook(request: FastifyRequest): Promise<void> {
  request.sessionToken = getSessionToken(request);
}

declare module "fastify" {
  interface FastifyRequest {
    sessionToken: string | null;
  }
}

export function buildSessionCookieHeader(sessionToken: string): string {
  const options = getSessionCookieOptions();
  const segments = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionToken)}`,
    "Path=/",
    "HttpOnly",
    `SameSite=Lax`,
    `Max-Age=${Math.floor((options.maxAge ?? 0) / 1000)}`,
  ];

  if (options.secure) {
    segments.push("Secure");
  }

  return segments.join("; ");
}

export function buildClearSessionCookieHeader(): string {
  const options = getSessionCookieOptions();
  const segments = [
    `${SESSION_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    `SameSite=Lax`,
    "Max-Age=0",
  ];

  if (options.secure) {
    segments.push("Secure");
  }

  return segments.join("; ");
}
