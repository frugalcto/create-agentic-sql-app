import { createApp } from "./app.js";
import { getPort, loadEnvFile } from "./config/loadEnv.js";
import { pool } from "./db/pool.js";

loadEnvFile();

const app = createApp();
const port = getPort();

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});

process.on("SIGINT", async () => {
  await pool.end();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await pool.end();
  process.exit(0);
});
