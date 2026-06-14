import net from "node:net";

import { afterEach, describe, expect, it, vi } from "vitest";

import { shouldRunE2e } from "../src/smoke/prerequisites.js";
import { waitForPort } from "../src/smoke/waitForPort.js";

function listenOnEphemeralPort(): Promise<{
  server: net.Server;
  port: number;
}> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();

      if (!address || typeof address === "string") {
        reject(new Error("Expected server to listen on a TCP port."));
        return;
      }

      resolve({ server, port: address.port });
    });
  });
}

function closeServer(server: net.Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

describe("smoke test helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("honors an explicit runE2e override", () => {
    expect(shouldRunE2e(true)).toBe(true);
    expect(shouldRunE2e(false)).toBe(false);
  });

  it("reads SMOKE_RUN_E2E from the environment", () => {
    vi.stubEnv("SMOKE_RUN_E2E", "1");
    expect(shouldRunE2e()).toBe(true);

    vi.stubEnv("SMOKE_RUN_E2E", "yes");
    expect(shouldRunE2e()).toBe(true);

    vi.stubEnv("SMOKE_RUN_E2E", "0");
    expect(shouldRunE2e()).toBe(false);
  });

  it("waits until a port accepts connections", async () => {
    const { server, port } = await listenOnEphemeralPort();

    await expect(waitForPort(port, "127.0.0.1")).resolves.toBeUndefined();
    await closeServer(server);
  });
});
