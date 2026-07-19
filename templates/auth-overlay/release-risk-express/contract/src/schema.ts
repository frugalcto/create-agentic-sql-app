import type { ZodType } from "zod";

import type { ErrorCode } from "./errors.js";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ParamSource =
  | `query.${string}`
  | `path.${string}`
  | `body.${string}`;

export type EndpointAuth = "public" | "required";

export type AuthBehavior = "none" | "setsSessionCookie" | "clearsSessionCookie";

export interface ProcedureParam {
  name: string;
  pgType: string;
  source: ParamSource;
}

export interface ProcedureBinding {
  name: string;
  params: ProcedureParam[];
}

export interface FrontendBinding {
  binding: "loader" | "action" | "none";
  file?: string;
}

export interface EndpointDefinition<
  TQuery extends ZodType | undefined = ZodType | undefined,
  TPath extends ZodType | undefined = ZodType | undefined,
  TBody extends ZodType | undefined = ZodType | undefined,
  TResponse extends ZodType = ZodType,
> {
  method: HttpMethod;
  path: string;
  auth: EndpointAuth;
  authBehavior?: AuthBehavior;
  query?: TQuery;
  pathParams?: TPath;
  body?: TBody;
  procedure: ProcedureBinding;
  response: TResponse;
  errorCodes: ErrorCode[];
  frontend: FrontendBinding;
  forbidden: string;
}

export function defineEndpoint<
  TQuery extends ZodType | undefined = undefined,
  TPath extends ZodType | undefined = undefined,
  TBody extends ZodType | undefined = undefined,
  TResponse extends ZodType = ZodType,
>(
  definition: EndpointDefinition<TQuery, TPath, TBody, TResponse>,
): EndpointDefinition<TQuery, TPath, TBody, TResponse> {
  return definition;
}
