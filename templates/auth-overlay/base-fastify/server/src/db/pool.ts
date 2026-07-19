import pg from "pg";

import { getDatabaseRuntimeUrl } from "../config/loadEnv.js";

export const pool = new pg.Pool({
  connectionString: getDatabaseRuntimeUrl(),
});
