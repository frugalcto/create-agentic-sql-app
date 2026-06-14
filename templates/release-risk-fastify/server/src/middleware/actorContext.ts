import type { FastifyRequest } from "fastify";

export const DEFAULT_ADMIN_USER_ID = "00000000-0000-0000-0000-000000000001";

export interface ActorContext {
  userId: string;
}

declare module "fastify" {
  interface FastifyRequest {
    actor: ActorContext;
  }
}

export function resolveActorContext(request: FastifyRequest): ActorContext {
  const headerValue = request.headers["x-demo-user-id"];
  const rawHeader = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  const userId =
    typeof rawHeader === "string" && rawHeader.trim().length > 0
      ? rawHeader.trim()
      : DEFAULT_ADMIN_USER_ID;

  return { userId };
}

export async function actorContextHook(request: FastifyRequest): Promise<void> {
  request.actor = resolveActorContext(request);
}
