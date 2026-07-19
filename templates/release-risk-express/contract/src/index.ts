export {
  ERROR_CODES,
  errorRegistry,
  INTERNAL_PROCEDURES,
  type ErrorCategory,
  type ErrorCode,
  type ErrorDefinition,
} from "./errors.js";
export { endpoints, type EndpointKey } from "./endpoints.js";
export {
  defineEndpoint,
  type EndpointDefinition,
  type FrontendBinding,
  type HttpMethod,
  type ParamSource,
  type ProcedureBinding,
  type ProcedureParam,
} from "./schema.js";
