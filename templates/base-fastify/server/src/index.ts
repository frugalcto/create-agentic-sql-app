import { createApp } from "./app.js";
import { getPort, loadEnvFile } from "./config/loadEnv.js";
import { pool } from "./db/pool.js";

loadEnvFile();

const port = getPort();
const app = await createApp();

await app.listen({
  port,
  host: "0.0.0.0",
});

console.log(`API server listening on http://localhost:${port}`);

async function shutdown(): Promise<void> {
  await app.close();
  await pool.end();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
