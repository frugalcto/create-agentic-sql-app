import { loadEnvFile } from "../src/config/loadEnv.js";

loadEnvFile();

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is required for server tests. Copy .env.example to .env and run migrations.",
  );
}
