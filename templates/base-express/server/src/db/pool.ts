import pg from "pg";

import { loadEnvFile } from "../config/loadEnv.js";

loadEnvFile();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required. Copy .env.example to .env and start PostgreSQL.",
  );
}

export const pool = new pg.Pool({
  connectionString: databaseUrl,
});
