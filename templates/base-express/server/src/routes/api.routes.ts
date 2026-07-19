import { Router } from "express";

import { endpoints } from "@__PROJECT_NAME_PKG__/contract";

import { registerEndpoint } from "../contract/registerEndpoint.js";

export const apiRouter = Router();

registerEndpoint(apiRouter, endpoints.health);
registerEndpoint(apiRouter, endpoints.getSampleDashboard);
registerEndpoint(apiRouter, endpoints.transitionRelease);
