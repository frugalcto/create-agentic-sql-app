import type {
  EndpointDefinition,
  ParamSource,
  ProcedureParam,
} from "@__PROJECT_NAME_PKG__/contract";

import type { ValidatedInputs } from "./validateInputs.js";

function readSourceValue(
  source: ParamSource,
  validated: ValidatedInputs,
): unknown {
  if (source.startsWith("query.")) {
    const key = source.slice("query.".length);
    return validated.query[key];
  }

  if (source.startsWith("path.")) {
    const key = source.slice("path.".length);
    return validated.pathParams[key];
  }

  if (source.startsWith("body.")) {
    const key = source.slice("body.".length);
    return validated.body[key];
  }

  throw new Error(`Unsupported parameter source: ${source}`);
}

export function bindProcedureArgs(
  endpoint: EndpointDefinition,
  validated: ValidatedInputs,
): Record<string, unknown> {
  const args: Record<string, unknown> = {};

  for (const param of endpoint.procedure.params) {
    args[param.name] = readSourceValue(param.source, validated);
  }

  return args;
}

export function getOrderedProcedureValues(
  params: ProcedureParam[],
  args: Record<string, unknown>,
): unknown[] {
  return params.map((param) => args[param.name]);
}
